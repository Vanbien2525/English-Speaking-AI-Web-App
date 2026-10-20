# HƯỚNG DẪN HUẤN LUYỆN & FINE-TUNE SPEECH AI TRÊN GOOGLE COLAB A100 HIGH-RAM

Tài liệu này cung cấp toàn bộ quy trình, cấu hình và kịch bản thực thi kịch bản huấn luyện mô hình trí tuệ nhân tạo chuyên biệt cho nền tảng **AI Speaking Tutor 3D** trên Google Colab GPU A100.

---

## 1. Tổng Quan Lộ Trình Huấn Luyện (Fine-Tuning Roadmap)

| Đợt Huấn Luyện | Nhiệm Vụ Kỹ Thuật | Dataset | Công Nghệ & Base Model | Thời Gian Dự Kiến Trên A100 | File Xuất Ra Google Drive |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Giai đoạn 0** | Chuẩn bị dữ liệu & Resample 16kHz | SpeechOcean762 & L2-ARCTIC | `torchaudio`, `librosa`, `soundfile` | ~20 - 30 phút | `/data/processed_16khz/` |
| **ĐỢT 1** | Fine-tune Mô hình chấm điểm âm vị (Accuracy, Fluency, Completeness, Prosody) | SpeechOcean762 (5.000 audio samples) | `facebook/wav2vec2-large-xlsr-53` (Multi-Task Regression Head) | ~45 phút - 1 tiếng | `wav2vec2_pronunciation_scorer/` |
| **ĐỢT 2** | Fine-tune Mô hình bắt lỗi phát âm người Việt (Lỗi nuốt âm đuôi, nhầm lẫn /θ/ thành /t/, /ð/ thành /d/) | L2-ARCTIC (Vietnamese Accented English: PNV, THV, TLV, TNI, HQTV, BWC) | `facebook/wav2vec2-large-xlsr-53` (Phoneme Error Classification & GOP Logits) | ~1 tiếng | `wav2vec2_vn_accent_detector/` |
| **ĐỢT 3** | Fine-tune AI Sư Phạm & Sinh chuỗi lệnh 3D Viseme Timeline | 1.500+ Cặp mẫu Sư phạm Khẩu hình & 3D Morph Weights | `unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit` (QLoRA 4-bit) | ~1 tiếng - 1.5 tiếng | `llama3.1_8b_tutor_3d_q4_k_m.gguf` |
| **Tích hợp TTS** | Giọng đọc người bản xứ chuẩn British RP | Pre-trained Microsoft Neural | `edge-tts` (`en-GB-SoniaNeural`, `en-GB-RyanNeural`) | 0 phút (Có sẵn) | Tích hợp trực tiếp |
| **Đóng gói** | Tự động nén và chuyển toàn bộ checkpoints sang Google Drive | Google Drive API | `tar -czvf` & Google Drive Mount | ~15 phút | `MyDrive/AI_Speaking_Tutor_Models/` |

> ⏱️ **TỔNG THỜI GIAN CHẠY TRÊN A100:** Khoảng **3.5 đến 4.5 giờ**.  
> 💡 Bạn có thể bật **"Run all" (Chạy tất cả)** một lần, treo máy khoảng 4 tiếng và toàn bộ kết quả sẽ được lưu an toàn vào Google Drive của bạn!

---

## 2. Hướng Dẫn Thao Tác Trên Google Colab

### Bước 1: Khởi Tạo Phiên Colab Pro / Pro+
1. Mở [Google Colab](https://colab.research.google.com/).
2. Nhấn **File** -> **Upload notebook** -> Chọn file `colab_a100_finetune_pipeline.ipynb` từ thư mục `services/ai-engine/training/colab_a100_finetune_pipeline.ipynb`.
3. Cấu hình phần cứng:
   - Vào menu **Runtime** (Thời gian chạy) -> **Change runtime type** (Thay đổi loại thời gian chạy).
   - **Hardware accelerator:** Chọn **A100 GPU**.
   - **Runtime shape:** Chọn **High-RAM** (Bộ nhớ RAM cao, ~83GB RAM).
   - Nhấn **Save**.

### Bước 2: Chuẩn Bị Token Hugging Face & Google Drive
- Chuẩn bị Hugging Face Token (Read access) để tự động tải base models: `HF_TOKEN`.
- Đảm bảo Google Drive còn trống tối thiểu **15GB dung lượng** để lưu các checkpoints và file GGUF.

### Bước 3: Chạy Tự Động (Run All)
- Vào menu **Runtime** -> Chọn **Run all** (hoặc nhấn `Ctrl + F9`).
- Colab sẽ yêu cầu bạn cấp quyền truy cập Google Drive ở ô đầu tiên, nhấn **Connect to Google Drive** và đăng nhập tài khoản của bạn.
- Sau khi cấp quyền, hệ thống sẽ tự động chạy liên tục qua 5 giai đoạn không cần can thiệp thủ công.

---

## 3. Cấu Trúc Các File Kết Quả Xuất Ra Google Drive

Sau khi hoàn thành, thư mục `Google Drive > MyDrive > AI_Speaking_Tutor_Models` sẽ chứa:

```text
MyDrive/AI_Speaking_Tutor_Models/
├── wav2vec2_pronunciation_scorer/           # Weights mô hình chấm điểm âm vị (Đợt 1)
│   ├── config.json
│   ├── model.safetensors
│   ├── preprocessor_config.json
│   └── tokenizer.json
├── wav2vec2_vn_accent_detector/             # Weights mô hình bắt lỗi người Việt (Đợt 2)
│   ├── config.json
│   ├── model.safetensors
│   └── vocab.json
├── llama3.1_8b_tutor_3d_q4_k_m.gguf        # Model GGUF gia sư sư phạm & Viseme 3D (Đợt 3)
└── metadata_manifest.json                   # Nhật ký huấn luyện và metrics kiểm định
```

---

## 4. Cách Nạp Mô Hình Vào Microservice FastAPI Cục Bộ

Khi tải các file từ Google Drive về máy cá nhân của bạn:

1. **Wav2Vec2 Checkpoints:** Copy vào thư mục `services/ai-engine/models/wav2vec2/`.
2. **Llama 3.1 GGUF:** 
   - Đưa vào Ollama:
     ```bash
     ollama create speaking-tutor-3d -f services/ai-engine/Modelfile
     ```
   - Hoặc nạp trực tiếp qua `llama-cpp-python` trong FastAPI.
3. **Khởi chạy Python AI Engine:**
   ```bash
   cd services/ai-engine
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
4. **Kích hoạt kết nối Next.js:** Đặt `AI_ENGINE_URL="http://127.0.0.1:8000"` trong `.env.local`.
