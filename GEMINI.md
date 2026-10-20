# PROJECT ARCHITECTURE & PROACTIVE PROTOCOL

## 1. Technical Stack
- **Platform:** Next.js App Router (React 19, TypeScript Strict) — SSR/SSG cho các trang tĩnh (Trang chủ, Danh mục bài học, Bảng thành tích) và On-Demand Lazy Loading (`ssr: false`) cho Phòng Luyện Phát Âm 3D.
- **3D & Motion Pipeline:** Three.js + React Three Fiber (`@react-three/fiber`, `@react-three/drei`) + GSAP (`@gsap/react`) + Motion (`motion`) + Design DNA (Tailwind CSS v4, OKLCH high-contrast tokens, self-hosted `Be Vietnam Pro` & `Charis SIL` IPA fonts) + Wavesurfer.js.
- **Speech AI Engine (Hybrid Adapter):** Python FastAPI (`services/ai-engine`) kết nối WhisperX + Wav2Vec2 + Ollama Llama 3.1 8B & `edge-tts` British RP (`en-GB-SoniaNeural`, `en-GB-RyanNeural`), hỗ trợ mở rộng sang Gemini Live / Azure Pronunciation Assessment qua Adapter interface; tuân thủ tuyệt đối cơ chế **Zero-Footprint In-Memory Audio**.
- **Database:** PostgreSQL 16 (`UUIDv7`, Integer Basis Points `0..10000` cho điểm số, `BIGINT` XP Ledger, ACID Transactions).
- **UI Pipeline:** Google Stitch Wireframe -> StitchMCP -> Antigravity Luxury UI.
- **Local Testing:** Vitest + React Testing Library (TDD red-to-green).
- **Cloud Audit:** GitHub Jules (Independent verification & APPROVE).
- **Merge Authority:** HUMAN ONLY (Tech Lead).

## 2. PROACTIVE NEXT-STEP ENGINE (BẮT BUỘC TUÂN THỦ)
Sau khi hoàn thành bất kỳ một giai đoạn nào, AI bắt buộc phải in ra hộp thoại điều hướng:
1. Việc vừa hoàn thành: Tóm tắt kết quả ngắn gọn.
2. Vị trí hiện tại: Cập nhật ngay vào `PROJECT_STATE.md`.
3. BƯỚC TIẾP THEO CẦN LÀM LÀ GÌ kèm đoạn PROMPT sẵn sàng để người dùng chỉ việc copy-paste và chạy!
