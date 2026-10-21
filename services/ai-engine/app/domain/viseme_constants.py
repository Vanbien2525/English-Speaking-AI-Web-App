"""
Phoneme to 3D Viseme and Articulatory Morph Mapping.
Provides morph target weights (0..1000 per-mille) and articulatory highlighting
for Three.js / React Three Fiber sagittal cross-section representation.
"""
from typing import TypedDict


class VisemePreset(TypedDict):
    morphWeights: dict[str, int]
    highlightParts: list[str]


# -----------------------------------------------------------------------------
# Mapping from IPA to 3D Viseme morph targets and highlights
# -----------------------------------------------------------------------------
IPA_VISEME_MAP: dict[str, VisemePreset] = {
    # Dental Fricatives (Interdental)
    "θ": {
        "morphWeights": {"jawOpen": 220, "tongueInterdental": 950, "lipSpread": 300},
        "highlightParts": ["tongue", "upper_teeth", "lower_teeth"],
    },
    "ð": {
        "morphWeights": {"jawOpen": 220, "tongueInterdental": 950, "vocalFoldsVibrating": 850},
        "highlightParts": ["tongue", "upper_teeth", "vocal_cords"],
    },

    # Bilabial Plosives & Nasal
    "p": {
        "morphWeights": {"bilabialClosure": 1000, "jawOpen": 100},
        "highlightParts": ["upper_lip", "lower_lip"],
    },
    "b": {
        "morphWeights": {"bilabialClosure": 1000, "jawOpen": 100, "vocalFoldsVibrating": 900},
        "highlightParts": ["upper_lip", "lower_lip", "vocal_cords"],
    },
    "m": {
        "morphWeights": {"bilabialClosure": 1000, "velumLower": 900, "vocalFoldsVibrating": 900},
        "highlightParts": ["upper_lip", "lower_lip", "velum", "nasal_cavity"],
    },

    # Labiodental Fricatives
    "f": {
        "morphWeights": {"labiodentalClosure": 950, "jawOpen": 150},
        "highlightParts": ["upper_teeth", "lower_lip"],
    },
    "v": {
        "morphWeights": {"labiodentalClosure": 950, "jawOpen": 150, "vocalFoldsVibrating": 900},
        "highlightParts": ["upper_teeth", "lower_lip", "vocal_cords"],
    },

    # Alveolar Plosives, Fricatives, Nasal
    "t": {
        "morphWeights": {"jawOpen": 180, "tongueElevation": 900},
        "highlightParts": ["tongue_tip", "alveolar_ridge"],
    },
    "d": {
        "morphWeights": {"jawOpen": 180, "tongueElevation": 900, "vocalFoldsVibrating": 850},
        "highlightParts": ["tongue_tip", "alveolar_ridge", "vocal_cords"],
    },
    "s": {
        "morphWeights": {"jawOpen": 120, "lipSpread": 400, "tongueElevation": 750},
        "highlightParts": ["tongue_tip", "alveolar_ridge"],
    },
    "z": {
        "morphWeights": {"jawOpen": 120, "lipSpread": 400, "tongueElevation": 750, "vocalFoldsVibrating": 900},
        "highlightParts": ["tongue_tip", "alveolar_ridge", "vocal_cords"],
    },
    "n": {
        "morphWeights": {"jawOpen": 150, "tongueElevation": 900, "velumLower": 950, "vocalFoldsVibrating": 900},
        "highlightParts": ["tongue_tip", "alveolar_ridge", "velum"],
    },
    "l": {
        "morphWeights": {"jawOpen": 250, "tongueElevation": 850, "vocalFoldsVibrating": 800},
        "highlightParts": ["tongue_tip", "alveolar_ridge"],
    },

    # Postalveolar & Palato-Alveolar
    "ʃ": {
        "morphWeights": {"jawOpen": 200, "mouthFunnel": 700, "tongueElevation": 600},
        "highlightParts": ["lips", "tongue_blade", "hard_palate"],
    },
    "ʒ": {
        "morphWeights": {"jawOpen": 200, "mouthFunnel": 700, "tongueElevation": 600, "vocalFoldsVibrating": 850},
        "highlightParts": ["lips", "tongue_blade", "hard_palate", "vocal_cords"],
    },
    "tʃ": {
        "morphWeights": {"jawOpen": 220, "mouthFunnel": 800, "tongueElevation": 850},
        "highlightParts": ["tongue_tip", "hard_palate", "lips"],
    },
    "dʒ": {
        "morphWeights": {"jawOpen": 220, "mouthFunnel": 800, "tongueElevation": 850, "vocalFoldsVibrating": 850},
        "highlightParts": ["tongue_tip", "hard_palate", "vocal_cords"],
    },

    # Velar Plosives & Nasal
    "k": {
        "morphWeights": {"jawOpen": 300, "palateContact": 950},
        "highlightParts": ["tongue_back", "velum"],
    },
    "ɡ": {
        "morphWeights": {"jawOpen": 300, "palateContact": 950, "vocalFoldsVibrating": 850},
        "highlightParts": ["tongue_back", "velum", "vocal_cords"],
    },
    "ŋ": {
        "morphWeights": {"jawOpen": 250, "palateContact": 950, "velumLower": 950, "vocalFoldsVibrating": 850},
        "highlightParts": ["tongue_back", "velum", "nasal_cavity"],
    },

    # Glottal Fricative
    "h": {
        "morphWeights": {"jawOpen": 400},
        "highlightParts": ["pharynx", "vocal_cords"],
    },

    # Approximants & Glides
    "r": {
        "morphWeights": {"jawOpen": 250, "mouthPucker": 500, "tongueRetroflex": 800},
        "highlightParts": ["tongue_tip", "hard_palate", "lips"],
    },
    "w": {
        "morphWeights": {"jawOpen": 150, "mouthPucker": 950, "vocalFoldsVibrating": 800},
        "highlightParts": ["upper_lip", "lower_lip", "velum"],
    },
    "j": {
        "morphWeights": {"jawOpen": 200, "lipSpread": 800, "tongueElevation": 800, "vocalFoldsVibrating": 800},
        "highlightParts": ["tongue_blade", "hard_palate"],
    },

    # Monophthongs & Diphthongs
    "iː": {
        "morphWeights": {"jawOpen": 150, "lipSpread": 900, "tongueElevation": 850},
        "highlightParts": ["tongue", "lips"],
    },
    "ɪ": {
        "morphWeights": {"jawOpen": 220, "lipSpread": 650, "tongueElevation": 700},
        "highlightParts": ["tongue"],
    },
    "e": {
        "morphWeights": {"jawOpen": 350, "lipSpread": 600, "tongueElevation": 500},
        "highlightParts": ["tongue", "jaw"],
    },
    "æ": {
        "morphWeights": {"jawOpen": 550, "lipSpread": 700, "tongueElevation": 300},
        "highlightParts": ["jaw", "tongue"],
    },
    "ɑː": {
        "morphWeights": {"jawOpen": 750, "mouthFunnel": 200},
        "highlightParts": ["jaw", "pharynx"],
    },
    "ɒ": {
        "morphWeights": {"jawOpen": 650, "mouthPucker": 600},
        "highlightParts": ["lips", "jaw"],
    },
    "ɔː": {
        "morphWeights": {"jawOpen": 500, "mouthPucker": 800},
        "highlightParts": ["lips"],
    },
    "ʊ": {
        "morphWeights": {"jawOpen": 250, "mouthPucker": 750, "tongueElevation": 600},
        "highlightParts": ["lips", "tongue_back"],
    },
    "uː": {
        "morphWeights": {"jawOpen": 180, "mouthPucker": 950, "tongueElevation": 750},
        "highlightParts": ["lips", "tongue_back"],
    },
    "ʌ": {
        "morphWeights": {"jawOpen": 500, "tongueElevation": 350},
        "highlightParts": ["jaw", "tongue"],
    },
    "ɜː": {
        "morphWeights": {"jawOpen": 350, "lipSpread": 300, "tongueElevation": 450},
        "highlightParts": ["tongue"],
    },
    "ə": {
        "morphWeights": {"jawOpen": 300, "lipSpread": 200, "tongueElevation": 400},
        "highlightParts": ["tongue"],
    },
}

# Default fallback for unknown IPA symbols
DEFAULT_VISEME_PRESET: VisemePreset = {
    "morphWeights": {"jawOpen": 300},
    "highlightParts": ["tongue", "lips"],
}


def get_viseme_preset(ipa: str) -> VisemePreset:
    """Return morph targets and articulatory highlights for a given IPA symbol."""
    clean_ipa = ipa.strip("/[]").lower()
    return IPA_VISEME_MAP.get(clean_ipa, DEFAULT_VISEME_PRESET)
