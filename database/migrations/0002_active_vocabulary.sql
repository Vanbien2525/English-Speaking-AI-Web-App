-- =============================================================================
-- Migration 0002: Active Vocabulary & 3D Flashcards (SM-2 Spaced Repetition)
-- Target      : PostgreSQL 16
-- Conventions : UUIDv7, Integer Basis Points (0..10000), Zero-Footprint Audio
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Vocabulary Decks (Bộ Từ Vựng Theo Chủ Đề)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocabulary_decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    item_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vocab_decks_user ON vocabulary_decks(user_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. Vocabulary Items (Thẻ Từ Vựng & Trạng Thái Thuật Toán SM-2)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocabulary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    deck_id UUID NOT NULL REFERENCES vocabulary_decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    ipa VARCHAR(100) NOT NULL,
    part_of_speech VARCHAR(30) NOT NULL DEFAULT 'noun',
    definition_vi TEXT NOT NULL,
    example_sentence_en TEXT NOT NULL,
    example_sentence_vi TEXT NOT NULL,
    articulatory_tip_vi TEXT,
    reference_audio_url TEXT,
    
    -- SM-2 Parameters (Integer Basis Points & Days)
    sm2_repetition INT NOT NULL DEFAULT 0,
    sm2_interval_days INT NOT NULL DEFAULT 1,
    sm2_ease_factor_bp INT NOT NULL DEFAULT 2500, -- 2.50
    sm2_next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sm2_last_reviewed_at TIMESTAMPTZ,
    
    -- Speaking-Verified Mastery
    last_mastery_score_bp INT, -- 0..10000
    is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
    mastery_attempts_count INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT uq_deck_word UNIQUE (deck_id, word)
);

CREATE INDEX IF NOT EXISTS idx_vocab_items_deck ON vocabulary_items(deck_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vocab_items_user_due ON vocabulary_items(user_id, sm2_next_review_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vocab_items_word_trgm ON vocabulary_items USING gin (word gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 3. Flashcard Speaking Reviews History (Lịch Sử Ôn Tập Bằng Giọng Nói)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    vocabulary_item_id UUID NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key UUID NOT NULL,
    quality_grade INT NOT NULL CHECK (quality_grade BETWEEN 0 AND 5),
    pronunciation_score_bp INT NOT NULL CHECK (pronunciation_score_bp BETWEEN 0 AND 10000),
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    
    interval_days_before INT NOT NULL,
    interval_days_after INT NOT NULL,
    ease_factor_before_bp INT NOT NULL,
    ease_factor_after_bp INT NOT NULL,
    
    xp_awarded BIGINT NOT NULL DEFAULT 0,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT uq_review_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_item ON flashcard_reviews(vocabulary_item_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_time ON flashcard_reviews(user_id, reviewed_at DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_vocabulary_decks_updated_at ON vocabulary_decks;
CREATE TRIGGER trg_vocabulary_decks_updated_at BEFORE UPDATE ON vocabulary_decks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_vocabulary_items_updated_at ON vocabulary_items;
CREATE TRIGGER trg_vocabulary_items_updated_at BEFORE UPDATE ON vocabulary_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
