-- =============================================================================
-- Migration 0001: Initial schema — AI Speaking Tutor 3D
-- Target      : PostgreSQL 16
-- Conventions : * Primary keys = UUIDv7 (time-ordered, B-Tree friendly)
--               * Integer-only numerics: scores in basis points (0..10000),
--                 XP as BIGINT ledger, durations in milliseconds
--               * TIMESTAMPTZ everywhere, soft delete via deleted_at
--               * Raw audio is NEVER persisted (zero-footprint audio policy)
-- NOTE        : Indexes below are created non-concurrently ONLY because the
--               tables are empty at bootstrap (and CONCURRENTLY cannot run
--               inside a transaction). Every future index on a populated table
--               MUST use CREATE INDEX CONCURRENTLY in its own migration.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- Utility functions
-- -----------------------------------------------------------------------------

-- RFC 9562 UUIDv7 generator. PostgreSQL 16 has no native uuidv7() (added in 18).
-- Takes a random v4 UUID, overlays the 48-bit unix epoch in milliseconds onto
-- the first 6 bytes and flips the version nibble from 0100 (v4) to 0111 (v7).
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  RETURN encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          PLACING substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
          FROM 1 FOR 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::uuid;
END
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------
CREATE TYPE accent_code        AS ENUM ('en-GB-RP', 'en-US-GA');
CREATE TYPE user_role          AS ENUM ('learner', 'admin');
CREATE TYPE phoneme_category   AS ENUM ('monophthong', 'diphthong', 'consonant');
CREATE TYPE lesson_item_kind   AS ENUM ('phoneme_drill', 'minimal_pair', 'word', 'sentence');
CREATE TYPE cefr_level         AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE engine_provider    AS ENUM ('local_whisperx_wav2vec2', 'gemini_live', 'azure_pronunciation');
CREATE TYPE attempt_status     AS ENUM ('pending', 'scored', 'failed');
CREATE TYPE phoneme_error_type AS ENUM ('correct', 'substitution', 'deletion', 'insertion', 'distortion');
-- good = green, minor = yellow, major = red (Design DNA status colors)
CREATE TYPE feedback_severity  AS ENUM ('good', 'minor', 'major');
CREATE TYPE xp_source          AS ENUM ('attempt_scored', 'lesson_completed', 'streak_bonus', 'achievement_unlocked', 'admin_adjustment');

-- =============================================================================
-- IDENTITY & ACCESS
-- =============================================================================
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email            CITEXT       NOT NULL,
  display_name     VARCHAR(80)  NOT NULL,
  password_hash    TEXT,                                   -- NULL in single-user local mode
  role             user_role    NOT NULL DEFAULT 'learner',
  native_language  VARCHAR(10)  NOT NULL DEFAULT 'vi',
  target_accent    accent_code  NOT NULL DEFAULT 'en-GB-RP',
  preferences      JSONB        NOT NULL DEFAULT '{}'::jsonb, -- {reducedMotion, xrayDefault, voice}
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,
  CONSTRAINT users_preferences_is_object CHECK (jsonb_typeof(preferences) = 'object'),
  CONSTRAINT users_display_name_not_blank CHECK (length(btrim(display_name)) > 0)
);
CREATE UNIQUE INDEX users_email_active_uq ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE auth_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash   BYTEA       NOT NULL,                        -- SHA-256 of opaque token; raw token never stored
  user_agent   TEXT,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT auth_sessions_expiry_after_creation CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX auth_sessions_token_hash_uq ON auth_sessions (token_hash);
CREATE INDEX auth_sessions_user_active_idx ON auth_sessions (user_id, expires_at) WHERE revoked_at IS NULL;

-- =============================================================================
-- PHONETICS CATALOG (IPA inventory + 3D viseme mapping)
-- =============================================================================
CREATE TABLE phonemes (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  ipa_symbol               VARCHAR(8)       NOT NULL,       -- e.g. 'θ', 'iː', 'eə'
  arpabet                  VARCHAR(4),                      -- e.g. 'TH', 'IY'
  category                 phoneme_category NOT NULL,
  is_voiced                BOOLEAN          NOT NULL,
  place_of_articulation    VARCHAR(32),                     -- dental, alveolar, bilabial...
  manner_of_articulation   VARCHAR(32),                     -- fricative, plosive, approximant...
  example_word             VARCHAR(64)      NOT NULL,
  articulation_guide_vi    TEXT             NOT NULL,
  common_vn_substitutions  TEXT[]           NOT NULL DEFAULT '{}', -- e.g. {s,t} for /θ/
  sort_order               SMALLINT         NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ      NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX phonemes_ipa_symbol_uq ON phonemes (ipa_symbol);

CREATE TABLE viseme_mappings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  phoneme_id            UUID        NOT NULL REFERENCES phonemes (id) ON DELETE CASCADE,
  accent                accent_code NOT NULL,
  morph_weights         JSONB       NOT NULL,               -- {"jawOpen": 350, "tongueTipUp": 900} per-mille 0..1000
  camera_preset         JSONB       NOT NULL DEFAULT '{}'::jsonb, -- {"position":[x,y,z],"target":[x,y,z],"fov":35}
  xray_highlight_parts  TEXT[]      NOT NULL DEFAULT '{}',  -- glTF mesh names: tongue, upper_teeth, lips...
  transition_ms         SMALLINT    NOT NULL DEFAULT 120,
  hold_ms               SMALLINT    NOT NULL DEFAULT 400,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT viseme_morph_weights_is_object CHECK (jsonb_typeof(morph_weights) = 'object'),
  CONSTRAINT viseme_camera_preset_is_object CHECK (jsonb_typeof(camera_preset) = 'object'),
  CONSTRAINT viseme_transition_range CHECK (transition_ms BETWEEN 0 AND 2000),
  CONSTRAINT viseme_hold_range CHECK (hold_ms BETWEEN 0 AND 5000),
  CONSTRAINT viseme_version_positive CHECK (version > 0)
);
CREATE UNIQUE INDEX viseme_mappings_phoneme_accent_uq ON viseme_mappings (phoneme_id, accent);

-- =============================================================================
-- CURRICULUM
-- =============================================================================
CREATE TABLE lesson_categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  slug            VARCHAR(80)  NOT NULL,
  title_en        VARCHAR(120) NOT NULL,
  title_vi        VARCHAR(120) NOT NULL,
  description_vi  TEXT,
  sort_order      SMALLINT     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX lesson_categories_slug_uq ON lesson_categories (slug);

CREATE TABLE lessons (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  category_id        UUID         NOT NULL REFERENCES lesson_categories (id) ON DELETE RESTRICT,
  slug               VARCHAR(120) NOT NULL,
  title_en           VARCHAR(160) NOT NULL,
  title_vi           VARCHAR(160) NOT NULL,
  description_vi     TEXT,
  cefr               cefr_level   NOT NULL,
  accent             accent_code  NOT NULL DEFAULT 'en-GB-RP',
  estimated_minutes  SMALLINT     NOT NULL,
  xp_reward          INTEGER      NOT NULL DEFAULT 50,
  tags               TEXT[]       NOT NULL DEFAULT '{}',
  is_published       BOOLEAN      NOT NULL DEFAULT false,
  sort_order         SMALLINT     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ,
  CONSTRAINT lessons_estimated_minutes_positive CHECK (estimated_minutes > 0),
  CONSTRAINT lessons_xp_reward_non_negative CHECK (xp_reward >= 0)
);
CREATE UNIQUE INDEX lessons_slug_active_uq ON lessons (slug) WHERE deleted_at IS NULL;
CREATE INDEX lessons_catalog_idx ON lessons (category_id, sort_order) WHERE is_published AND deleted_at IS NULL;
CREATE INDEX lessons_tags_gin_idx ON lessons USING GIN (tags);

CREATE TABLE lesson_items (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  lesson_id              UUID             NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  kind                   lesson_item_kind NOT NULL,
  position               SMALLINT         NOT NULL,
  prompt_text            TEXT             NOT NULL,          -- "think", "three free throws"
  ipa_transcription      TEXT             NOT NULL,          -- "/θɪŋk/"
  translation_vi         TEXT,
  reference_voice        VARCHAR(64)      NOT NULL DEFAULT 'en-GB-SoniaNeural',
  reference_audio_path   TEXT,                               -- cached edge-tts file, relative to public/
  reference_duration_ms  INTEGER,
  created_at             TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ      NOT NULL DEFAULT now(),
  CONSTRAINT lesson_items_position_non_negative CHECK (position >= 0),
  CONSTRAINT lesson_items_reference_duration_positive CHECK (reference_duration_ms IS NULL OR reference_duration_ms > 0)
);
CREATE UNIQUE INDEX lesson_items_lesson_position_uq ON lesson_items (lesson_id, position);
CREATE INDEX lesson_items_prompt_trgm_idx ON lesson_items USING GIN (prompt_text gin_trgm_ops);

-- N-N: lesson_items <-> phonemes (ordered phoneme sequence of each item)
CREATE TABLE lesson_item_phonemes (
  lesson_item_id  UUID     NOT NULL REFERENCES lesson_items (id) ON DELETE CASCADE,
  position        SMALLINT NOT NULL,
  phoneme_id      UUID     NOT NULL REFERENCES phonemes (id) ON DELETE RESTRICT,
  is_focus        BOOLEAN  NOT NULL DEFAULT false,           -- target phoneme of the drill
  PRIMARY KEY (lesson_item_id, position),
  CONSTRAINT lesson_item_phonemes_position_non_negative CHECK (position >= 0)
);
CREATE INDEX lesson_item_phonemes_phoneme_idx ON lesson_item_phonemes (phoneme_id);
CREATE INDEX lesson_item_phonemes_focus_idx ON lesson_item_phonemes (phoneme_id, lesson_item_id) WHERE is_focus;

-- =============================================================================
-- PRACTICE & SCORING
-- =============================================================================
CREATE TABLE practice_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id       UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id     UUID        NOT NULL REFERENCES lessons (id) ON DELETE RESTRICT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  client_meta   JSONB       NOT NULL DEFAULT '{}'::jsonb,    -- {gpuTier, avgFps, browser}
  CONSTRAINT practice_sessions_completed_after_started CHECK (completed_at IS NULL OR completed_at >= started_at),
  CONSTRAINT practice_sessions_client_meta_is_object CHECK (jsonb_typeof(client_meta) = 'object')
);
CREATE INDEX practice_sessions_user_started_idx ON practice_sessions (user_id, started_at DESC);
CREATE INDEX practice_sessions_lesson_idx ON practice_sessions (lesson_id);

CREATE TABLE practice_attempts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  session_id          UUID            NOT NULL REFERENCES practice_sessions (id) ON DELETE CASCADE,
  user_id             UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE, -- denormalized for IDOR guard + fast history
  lesson_item_id      UUID            NOT NULL REFERENCES lesson_items (id) ON DELETE RESTRICT,
  idempotency_key     UUID            NOT NULL,              -- client-generated per recording; dedupes network retries
  status              attempt_status  NOT NULL DEFAULT 'pending',
  engine              engine_provider NOT NULL,
  engine_version      VARCHAR(64)     NOT NULL,
  recognized_text     TEXT,
  overall_score_bp    SMALLINT,
  accuracy_bp         SMALLINT,
  fluency_bp          SMALLINT,
  completeness_bp     SMALLINT,
  prosody_bp          SMALLINT,
  audio_duration_ms   INTEGER         NOT NULL,
  scoring_latency_ms  INTEGER,
  word_results        JSONB           NOT NULL DEFAULT '[]'::jsonb,
  tutor_feedback      JSONB           NOT NULL DEFAULT '{}'::jsonb, -- LLM explanation + viseme command timeline
  error_code          VARCHAR(64),
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  scored_at           TIMESTAMPTZ,
  CONSTRAINT attempts_overall_range      CHECK (overall_score_bp IS NULL OR overall_score_bp BETWEEN 0 AND 10000),
  CONSTRAINT attempts_accuracy_range     CHECK (accuracy_bp IS NULL OR accuracy_bp BETWEEN 0 AND 10000),
  CONSTRAINT attempts_fluency_range      CHECK (fluency_bp IS NULL OR fluency_bp BETWEEN 0 AND 10000),
  CONSTRAINT attempts_completeness_range CHECK (completeness_bp IS NULL OR completeness_bp BETWEEN 0 AND 10000),
  CONSTRAINT attempts_prosody_range      CHECK (prosody_bp IS NULL OR prosody_bp BETWEEN 0 AND 10000),
  CONSTRAINT attempts_audio_duration_range CHECK (audio_duration_ms BETWEEN 1 AND 60000),
  CONSTRAINT attempts_latency_non_negative CHECK (scoring_latency_ms IS NULL OR scoring_latency_ms >= 0),
  CONSTRAINT attempts_word_results_is_array CHECK (jsonb_typeof(word_results) = 'array'),
  CONSTRAINT attempts_tutor_feedback_is_object CHECK (jsonb_typeof(tutor_feedback) = 'object'),
  CONSTRAINT attempts_scored_requires_scores CHECK (
    status <> 'scored'
    OR (overall_score_bp IS NOT NULL AND accuracy_bp IS NOT NULL AND fluency_bp IS NOT NULL
        AND completeness_bp IS NOT NULL AND scored_at IS NOT NULL)
  ),
  CONSTRAINT attempts_failed_requires_error CHECK (status <> 'failed' OR error_code IS NOT NULL)
);
CREATE UNIQUE INDEX practice_attempts_idempotency_uq ON practice_attempts (user_id, idempotency_key);
CREATE INDEX practice_attempts_user_created_idx ON practice_attempts (user_id, created_at DESC);
CREATE INDEX practice_attempts_session_created_idx ON practice_attempts (session_id, created_at);
CREATE INDEX practice_attempts_lesson_item_idx ON practice_attempts (lesson_item_id);

-- Normalized phoneme-level results: powers "weak phoneme" analytics & mastery charts
CREATE TABLE attempt_phoneme_results (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  attempt_id           UUID               NOT NULL REFERENCES practice_attempts (id) ON DELETE CASCADE,
  user_id              UUID               NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  position             SMALLINT           NOT NULL,
  expected_phoneme_id  UUID               REFERENCES phonemes (id) ON DELETE RESTRICT, -- NULL on insertion
  actual_phoneme_id    UUID               REFERENCES phonemes (id) ON DELETE RESTRICT, -- NULL on deletion
  error_type           phoneme_error_type NOT NULL,
  severity             feedback_severity  NOT NULL,
  gop_score_bp         SMALLINT           NOT NULL,
  start_ms             INTEGER,
  end_ms               INTEGER,
  created_at           TIMESTAMPTZ        NOT NULL DEFAULT now(),
  CONSTRAINT apr_gop_range CHECK (gop_score_bp BETWEEN 0 AND 10000),
  CONSTRAINT apr_position_non_negative CHECK (position >= 0),
  CONSTRAINT apr_timing_order CHECK (start_ms IS NULL OR end_ms IS NULL OR end_ms >= start_ms),
  CONSTRAINT apr_error_type_consistency CHECK (
       (error_type = 'insertion' AND expected_phoneme_id IS NULL     AND actual_phoneme_id IS NOT NULL)
    OR (error_type = 'deletion'  AND expected_phoneme_id IS NOT NULL AND actual_phoneme_id IS NULL)
    OR (error_type IN ('correct', 'substitution', 'distortion')
        AND expected_phoneme_id IS NOT NULL AND actual_phoneme_id IS NOT NULL)
  )
);
CREATE UNIQUE INDEX apr_attempt_position_uq ON attempt_phoneme_results (attempt_id, position);
CREATE INDEX apr_user_expected_created_idx ON attempt_phoneme_results (user_id, expected_phoneme_id, created_at DESC);
CREATE INDEX apr_user_errors_idx ON attempt_phoneme_results (user_id, expected_phoneme_id) WHERE error_type <> 'correct';

-- =============================================================================
-- PROGRESS & GAMIFICATION
-- =============================================================================
CREATE TABLE user_phoneme_mastery (
  user_id            UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  phoneme_id         UUID        NOT NULL REFERENCES phonemes (id) ON DELETE CASCADE,
  attempts_count     INTEGER     NOT NULL DEFAULT 0,
  correct_count      INTEGER     NOT NULL DEFAULT 0,
  score_sum_bp       BIGINT      NOT NULL DEFAULT 0,       -- average = score_sum_bp / attempts_count (integer math)
  last_practiced_at  TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, phoneme_id),
  CONSTRAINT upm_counts_valid CHECK (attempts_count >= 0 AND correct_count BETWEEN 0 AND attempts_count),
  CONSTRAINT upm_score_sum_non_negative CHECK (score_sum_bp >= 0)
);
CREATE INDEX upm_user_last_practiced_idx ON user_phoneme_mastery (user_id, last_practiced_at DESC);

CREATE TABLE user_lesson_progress (
  user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id       UUID        NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  best_score_bp   SMALLINT    NOT NULL DEFAULT 0,
  attempts_count  INTEGER     NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT ulp_best_score_range CHECK (best_score_bp BETWEEN 0 AND 10000),
  CONSTRAINT ulp_attempts_non_negative CHECK (attempts_count >= 0)
);
CREATE INDEX ulp_lesson_idx ON user_lesson_progress (lesson_id);

CREATE TABLE user_stats (
  user_id              UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  total_xp             BIGINT      NOT NULL DEFAULT 0,
  current_streak_days  INTEGER     NOT NULL DEFAULT 0,
  longest_streak_days  INTEGER     NOT NULL DEFAULT 0,
  last_active_date     DATE,
  lessons_completed    INTEGER     NOT NULL DEFAULT 0,
  version              INTEGER     NOT NULL DEFAULT 0,      -- optimistic locking counter
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_stats_non_negative CHECK (
    total_xp >= 0 AND current_streak_days >= 0 AND longest_streak_days >= current_streak_days
    AND lessons_completed >= 0 AND version >= 0
  )
);
CREATE INDEX user_stats_total_xp_idx ON user_stats (total_xp DESC);

-- Append-only XP ledger (integer "currency"). Balance mutations must run in the
-- same transaction as the user_stats update (SELECT ... FOR UPDATE on user_stats).
CREATE TABLE xp_ledger (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id          UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount           BIGINT       NOT NULL,
  balance_after    BIGINT       NOT NULL,
  source           xp_source    NOT NULL,
  reference_id     UUID,                                   -- attempt / lesson / achievement id
  idempotency_key  VARCHAR(128) NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT xp_ledger_amount_non_zero CHECK (amount <> 0),
  CONSTRAINT xp_ledger_balance_non_negative CHECK (balance_after >= 0)
);
CREATE UNIQUE INDEX xp_ledger_idempotency_uq ON xp_ledger (user_id, idempotency_key);
CREATE INDEX xp_ledger_user_created_idx ON xp_ledger (user_id, created_at DESC);
CREATE INDEX xp_ledger_weekly_leaderboard_idx ON xp_ledger (created_at, user_id) INCLUDE (amount);

CREATE TABLE achievements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code            VARCHAR(64)  NOT NULL,
  title_vi        VARCHAR(120) NOT NULL,
  description_vi  TEXT         NOT NULL,
  icon            VARCHAR(64)  NOT NULL,
  xp_reward       INTEGER      NOT NULL DEFAULT 0,
  criteria        JSONB        NOT NULL,                   -- {"type":"phoneme_mastery","ipa":"θ","minScoreBp":8000}
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT achievements_xp_reward_non_negative CHECK (xp_reward >= 0),
  CONSTRAINT achievements_criteria_is_object CHECK (jsonb_typeof(criteria) = 'object')
);
CREATE UNIQUE INDEX achievements_code_uq ON achievements (code);

-- N-N: users <-> achievements
CREATE TABLE user_achievements (
  user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_id  UUID        NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX user_achievements_achievement_idx ON user_achievements (achievement_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_users_updated_at                BEFORE UPDATE ON users                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_phonemes_updated_at             BEFORE UPDATE ON phonemes             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_viseme_mappings_updated_at      BEFORE UPDATE ON viseme_mappings      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lesson_categories_updated_at    BEFORE UPDATE ON lesson_categories    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lessons_updated_at              BEFORE UPDATE ON lessons              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lesson_items_updated_at         BEFORE UPDATE ON lesson_items         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_phoneme_mastery_updated_at BEFORE UPDATE ON user_phoneme_mastery FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_lesson_progress_updated_at BEFORE UPDATE ON user_lesson_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_stats_updated_at           BEFORE UPDATE ON user_stats           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_achievements_updated_at         BEFORE UPDATE ON achievements         FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
