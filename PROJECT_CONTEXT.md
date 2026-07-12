# PROJECT_CONTEXT.md

Tài liệu này cung cấp bối cảnh toàn diện, kiến trúc, và chi tiết triển khai hiện tại của dự án **Nihongo Conqueror** (Nihongo Manager). Được thiết kế để một AI Agent mới có thể ngay lập tức nắm bắt và tiếp tục phát triển hệ thống mà không cần thêm thông tin giải thích bên ngoài.

---

# 1. Project Overview

*   **Dự án dùng để làm gì:** 
    *   Học tiếng Nhật toàn diện từ cơ bản đến nâng cao bao gồm bảng chữ cái (Hiragana & Katakana), từ vựng, ngữ pháp theo giáo trình Minna no Nihongo (Trình độ N5 đến N1).
    *   Cung cấp các chế độ kiểm tra tương tác thông minh như Sống sót (Survival Test), Kéo ghép phản xạ (Matching Game), Flashcard hướng dẫn thứ tự viết nét chữ (Stroke Order Tracing) trực quan, cùng các công cụ AI hỗ trợ dịch thuật và tự động phân loại từ vựng.
    *   Hỗ trợ lưu trữ tiến trình học tập hai tầng (đồng bộ hóa đám mây Cloud Firestore và bộ nhớ đệm Local Storage làm dự phòng).
*   **Người dùng mục tiêu:** Học viên tự học tiếng Nhật từ cấp độ sơ cấp (chưa biết gì) cho đến người ôn luyện các cấp độ JLPT từ N5 tới N1.
*   **Chức năng hiện có:**
    *   Màn hình học bảng chữ cái & luyện tập phản xạ nhanh (Hiragana/Katakana).
    *   Màn hình học theo Giáo trình Minna no Nihongo (Bài 1 - Bài 25 cấp độ N5 hoàn thiện dữ liệu; hỗ trợ giao diện cấp độ N4 - N1).
    *   Hệ thống học từ vựng tương tác: Danh sách từ vựng, flashcard lật thẻ, game ghép cặp từ vựng, bài thi trắc nghiệm theo bài học.
    *   Công cụ AI tích hợp: Tự động phân loại từ vựng theo chủ đề/ngữ cảnh và dịch nghĩa tiếng Anh bị thiếu bằng mô hình Gemini thông minh.
    *   Đồng bộ tiến độ học tập: Đăng nhập vô danh (Anonymous Auth) hoặc đăng ký/đăng nhập bằng tài khoản tự chọn để đồng bộ tiến độ qua Firestore.
    *   Tra cứu từ vựng: Thanh tìm kiếm nhanh trên toàn bộ cơ sở dữ liệu bài học và từ vựng tự do từ Firestore.

---

# 2. Current State

*   **Dự án đã hoàn thành những gì:**
    *   **Giao diện & Trải nghiệm người dùng:** Responsive hoàn chỉnh cho cả desktop và thiết bị di động. Khắc phục triệt để lỗi tràn khung màn hình bằng cách áp dụng rộng rãi các class quản lý kích thước như `min-w-0`, `max-w-full`, và `overflow-x-hidden`.
    *   **Backend Server (server.ts):** Tích hợp thành công SDK `@google/genai` (với cơ chế khởi tạo lazy-loading bảo mật và cơ chế tự động chuyển đổi dự phòng mô hình từ `gemini-3.5-flash` sang các dòng Gemini khác nếu xảy ra quá tải).
    *   **Đồng bộ Firestore:** Các tính năng lưu trữ tiến độ học tập, quản lý tài khoản thủ công, lưu và tải dữ liệu từ vựng tự do (`casual_vocab`) và bài học hoàn toàn chạy ổn định, có lớp fallback xuống Local Storage nếu kết nối mạng bị gián đoạn.
    *   **Tính năng Phản xạ:** Chế độ chơi Sống sót (Survival Test) và Ghép chữ (Matching Game) cùng biểu đồ chọn lọc âm tiết chạy mượt mà.
    *   **Bộ phát âm & Âm thanh:** Tích hợp bộ tổng hợp âm thanh Web Audio API (phát tiếng ting-ting khi đúng và bíp trầm khi sai) cùng bộ TTS phát âm tiếng Nhật bản xứ qua `SpeechSynthesisUtterance`.
*   **Những tính năng đang làm dở (In Progress):**
    *   Dữ liệu bài học cho các cấp độ nâng cao (N4 đến N1) hiện tại đang để nhãn "Pro" và hiển thị giao diện nâng cấp, chưa tích hợp sẵn danh sách từ vựng và ngữ pháp đầy đủ như cấp độ N5.
*   **Những phần còn thiếu (Missing / Planned):**
    *   Phần vẽ nét trực tiếp của người dùng lên canvas để AI hoặc thuật toán nhận diện nét chữ Kanji/Hiragana (hiện tại mới chỉ dừng lại ở hướng dẫn mô tả thứ tự viết nét chữ).
*   **Những lỗi hoặc hạn chế đã biết:**
    *   API SpeechSynthesis (TTS) phụ thuộc vào giọng đọc ja-JP cài đặt sẵn trên thiết bị của trình duyệt người dùng. Nếu thiết bị không hỗ trợ giọng đọc tiếng Nhật chuẩn, âm thanh TTS phát âm có thể bị biến dạng hoặc không phát ra tiếng (đã có khối try-catch an toàn để không làm sập ứng dụng).

---

# 3. Architecture

*   **Công nghệ sử dụng:**
    *   **Frontend:** React (v19), TypeScript (v5.8), Vite (v6), Tailwind CSS (v4) làm khung giao diện chính, Framer Motion (`motion/react`) xử lý chuyển động mượt mà.
    *   **Backend:** Node.js, Express (v4), `tsx` làm môi trường chạy Dev, `esbuild` biên dịch backend thành file CJS duy nhất (`dist/server.cjs`) cho môi trường Production.
    *   **Cơ sở dữ liệu & Xác thực:** Firebase Client SDK (v12) tích hợp Firestore và Firebase Authentication.
    *   **AI Engine:** SDK `@google/genai` (v2.4.0) thực thi các tác vụ xử lý bối cảnh ngôn ngữ ở phía máy chủ Express.
*   **Cấu trúc thư mục:**
    ```
    ├── .env.example                  # Định nghĩa các biến môi trường mẫu
    ├── firebase-applet-config.json   # Cấu hình Firebase Client (Auto-generated/Managed)
    ├── firebase-blueprint.json       # Schema Firestore blueprint
    ├── firestore.rules               # Quy tắc bảo mật Firestore
    ├── package.json                  # Scripts build, start, và danh sách thư viện phụ thuộc
    ├── server.ts                     # Máy chủ backend Express (API Proxy, Gemini Integration, static hosting)
    ├── tsconfig.json                 # Cấu hình biên dịch TypeScript
    ├── vite.config.ts                # Cấu hình bundler Vite
    └── src/
        ├── App.tsx                   # Điểm khởi đầu ứng dụng React & Điều hướng View chính
        ├── main.tsx                  # File mount DOM của React vào index.html
        ├── index.css                 # File import Tailwind CSS và cấu hình Google Fonts
        ├── constraints.css           # Các quy chuẩn layout bổ sung
        ├── components/               # Chứa các component giao diện tách biệt
        │   ├── BasicJapaneseCourse.tsx # Giao diện chính của các bài học Minna No Nihongo
        │   ├── HiraganaChart.tsx     # Bộ chọn lọc âm tiết bảng chữ cái
        │   ├── SurvivalTestMode.tsx  # Trắc nghiệm sinh tồn bảng chữ cái
        │   ├── MatchingGame.tsx      # Trò chơi kéo ghép phản xạ nhanh
        │   ├── FlashcardMode.tsx     # Flashcard và nét vẽ bảng chữ cái
        │   ├── KanjiLearning.tsx     # Giao diện học chữ Kanji và Flashcard lật thẻ
        │   ├── Header.tsx            # Header bổ sung của bảng chữ cái
        │   ├── QuizMode.tsx          # Các bài trắc nghiệm nhanh bổ sung
        │   └── MasteryTestMode.tsx   # Hệ thống bài kiểm tra cấp độ cao hơn
        ├── data/                     # Dữ liệu tĩnh cục bộ của ứng dụng
        │   ├── hiragana.ts           # Dữ liệu 46 chữ cái Hiragana kèm âm ghép
        │   ├── katakana.ts           # Dữ liệu 46 chữ cái Katakana kèm âm ghép
        │   ├── kanji.ts              # Cơ sở dữ liệu chữ Kanji (âm On, âm Kun, nghĩa, số nét)
        │   ├── lessons.ts            # Dữ liệu tĩnh 25 bài học N5 Minna no Nihongo
        │   └── vocabulary.ts         # Cơ sở dữ liệu từ vựng thô
        └── utils/                    # Các module tiện ích dùng chung
            ├── audio.ts              # SoundEngine (Web Audio API) và TTS Engine
            └── firebase.ts           # Module kết nối, xác thực và đồng bộ hóa Firestore
    ```
*   **Luồng hoạt động chính:**
    1.  **Khởi động:** Khi ứng dụng mở ra, React mount qua `main.tsx`. `App.tsx` kiểm tra trạng thái đăng nhập qua `utils/firebase.ts`, thực hiện đăng nhập vô danh tự động nếu chưa có tài khoản, hoặc giữ nguyên phiên của tài khoản tự tạo đã lưu.
    2.  **Đồng bộ tiến trình:** Tải danh sách bài học đã mở khóa/đã hoàn thành từ Firestore bộ sưu tập `user_progress` dựa trên UID người dùng. Nếu mất mạng, hệ thống tự động đọc từ `localStorage`.
    3.  **Tương tác Bài học:** Người dùng chọn tab điều hướng bên sidebar:
        *   **Minna no Nihongo:** Hiển thị danh sách bài học thông qua `BasicJapaneseCourse.tsx`. Người dùng học lý thuyết, từ vựng, kiểm tra hoặc sử dụng tính năng AI để dịch và phân loại ngữ cảnh.
        *   **Bảng chữ cái:** Cấu hình bộ lọc hàng âm tại `HiraganaChart.tsx`, sau đó tham gia game `MatchingGame.tsx` hoặc `SurvivalTestMode.tsx`.
        *   **Học Kanji:** Tra cứu Kanji, lọc theo chủ đề tại `KanjiLearning.tsx`, học qua Flashcard lật thẻ phản xạ nhanh.
    4.  **Xử lý API & AI:** Các thao tác phân loại từ vựng hoặc bổ sung nghĩa tiếng Anh sẽ gửi request lên endpoint `/api/vocab/categorize` hoặc `/api/vocab/translate-english` trên Express. Express gọi trực tiếp tới Gemini API và trả về JSON chuẩn cho client cập nhật UI tức thời.

---

# 4. Existing Features

### A. Luyện tập phản xạ Bảng chữ cái (Hiragana/Katakana)
*   **Mục đích:** Giúp học viên ghi nhớ sâu sắc mặt chữ cái Hiragana và Katakana.
*   **Cách hoạt động:** Người dùng chọn âm tiết cần học thông qua bảng grid trực quan (HiraganaChart), sau đó có hai chế độ tương tác:
    *   *Sống sót:* Trắc nghiệm 4 lựa chọn, yêu cầu đạt chuỗi 5 câu đúng liên tục không sai để thắng.
    *   *Kéo ghép:* Kéo thả nối cặp chữ cái Nhật tương ứng với phiên âm Romaji dưới áp lực thời gian.
*   **Những file chính:** `/src/components/HiraganaChart.tsx`, `/src/components/SurvivalTestMode.tsx`, `/src/components/MatchingGame.tsx`, `/src/data/hiragana.ts`, `/src/data/katakana.ts`.
*   **Trạng thái:** Completed.

### B. Bài học Minna no Nihongo (N5 - N1)
*   **Mục đích:** Truyền tải nội dung lý thuyết ngữ pháp, từ vựng chuẩn của giáo trình Minna.
*   **Cách hoạt động:** Bài học hiển thị cấu trúc ngữ pháp kèm ví dụ chi tiết, danh sách từ vựng có nút phát âm bản xứ (TTS) và các chế độ thi thử trắc nghiệm nhanh để mở khóa bài học tiếp theo.
*   **Những file chính:** `/src/components/BasicJapaneseCourse.tsx`, `/src/data/lessons.ts`, `/src/data/vocabulary.ts`.
*   **Trạng thái:** N5 hoàn thành hoàn hảo (Completed), các cấp độ N4 - N1 đã dựng khung và luồng khóa học (Planned / In Progress).

### C. Công cụ AI thông minh (Độc quyền phía máy chủ)
*   **Mục đích:** Ứng dụng AI phân loại từ vựng thành các nhóm ngữ cảnh sử dụng và dịch thuật tức thời các nghĩa tiếng Anh bị thiếu.
*   **Cách hoạt động:** Gọi API POST lên Express. Express sử dụng systemInstruction thông minh và cấu hình `responseSchema` nghiêm ngặt của SDK `@google/genai` để trả về định dạng mảng JSON tối ưu, đảm bảo không bị lỗi phân tích cú pháp ở Client.
*   **Những file chính:** `/server.ts`, `/src/components/BasicJapaneseCourse.tsx`.
*   **Trạng thái:** Completed.

### D. Hệ thống đồng bộ hóa & Quản lý tài khoản đa tầng
*   **Mục đích:** Lưu trữ tiến trình học để người dùng không bị mất dữ liệu khi đổi trình duyệt hoặc xóa cache.
*   **Cách hoạt động:** Đồng bộ hai lớp giữa Firestore và LocalStorage. Người dùng có thể đăng ký nhanh bằng tên đăng nhập tùy chọn để sao lưu tiến trình lâu dài.
*   **Những file chính:** `/src/utils/firebase.ts`, bộ quy tắc bảo mật `firestore.rules`.
*   **Trạng thái:** Completed.

### E. Học chữ Kanji cơ bản
*   **Mục đích:** Học các chữ Hán tự tiếng Nhật cơ bản qua phân loại chủ đề và flashcard lật thẻ.
*   **Cách hoạt động:** Hiển thị lưới danh sách Kanji kèm âm On/Kun và nghĩa tiếng Việt. Chế độ Flashcard cho phép lật thẻ để kiểm tra trí nhớ tức thời kèm hiệu ứng âm thanh sống động.
*   **Những file chính:** `/src/components/KanjiLearning.tsx`, `/src/data/kanji.ts`.
*   **Trạng thái:** Completed.

---

# 5. Important Files

*   **`server.ts` (Express Entry Point):** 
    *   *Vai trò:* File chạy máy chủ Node/Express chính. Nó cấu hình proxy an toàn cho Gemini API bằng cách đọc `GEMINI_API_KEY` từ môi trường server (không bao giờ lộ ra client).
    *   *Chi tiết đặc biệt:* Nó tích hợp Middleware của Vite trong quá trình chạy Development và tự động chuyển sang phân phối static file trong thư mục `dist` nếu chạy Production.
*   **`src/App.tsx` (Main View Controller):**
    *   *Vai trò:* Điểm trung chuyển điều hướng toàn bộ ứng dụng. Điều khiển đóng mở Sidebar điện thoại, lưu trữ bộ lọc bảng chữ cái đã chọn, quản lý từ khóa tìm kiếm nhanh trên toàn bộ cơ sở dữ liệu và chuyển đổi trạng thái View chính.
*   **`src/components/BasicJapaneseCourse.tsx`:**
    *   *Vai trò:* Trái tim của toàn bộ tính năng học Minna. Chứa logic từ vựng, ngữ pháp, các trò chơi tương tác liên quan đến từ vựng bài học, tích hợp giao diện gọi trợ lý AI Gemini và thực hiện đồng bộ hóa Cloud Firestore.
*   **`src/utils/firebase.ts`:**
    *   *Vai trò:* Định cấu hình kết nối Firestore và Auth. Triển khai cấu trúc xử lý lỗi Firestore có cấu trúc kèm thông tin người dùng hỗ trợ phân tích log, thiết lập cơ chế fallback UID cục bộ nếu kết nối Firestore bị khóa hoặc lỗi.
*   **`src/utils/audio.ts` (SoundEngine):**
    *   *Vai trò:* Trình phát âm thanh tương tác. Tạo tần số âm thanh sóng sin/tam giác trực tiếp qua Web Audio API không phụ thuộc vào file âm thanh tĩnh bên ngoài, và điều hướng cơ chế Text-to-Speech phát âm tiếng Nhật chuẩn.

---

# 6. Development Notes

*   **Những quy ước đang được sử dụng:**
    *   **Port & Ingress:** Toàn bộ máy chủ dev và production **BẮT BUỘC** phải chạy trên port **3000** và bind vào host `0.0.0.0` để hệ thống proxy của Cloud Run định tuyến thành công. Không cố gắng thay đổi hay đọc biến PORT từ môi trường.
    *   **Không lộ API Key:** Tuyệt đối không khai báo bất cứ API Key nhạy cảm nào ở phía Client (không dùng tiền tố `VITE_` cho các khóa bảo mật). Mọi khóa API phải được giữ phía Server trong file `.env` và được proxy an toàn qua router Express `/api/*`.
    *   **An toàn và Phục hồi lỗi:** Mọi tương tác lưu trữ Firestore đều phải chạy song song cơ chế ghi nhận đệm vào `localStorage` để ứng dụng luôn hoạt động bình thường ngay cả khi không có kết nối internet hoặc tài khoản bị giới hạn quyền.
*   **Những điểm cần lưu ý khi sửa code:**
    *   **Tránh lỗi tràn màn hình (Overflow/Layout Break):** Giao diện của ứng dụng được tối ưu hóa cho màn hình điện thoại dọc siêu nhỏ. Do đó, khi tạo hoặc chỉnh sửa các thẻ div chứa danh sách dài, tab cuộn, hay tiêu đề, **phải luôn** sử dụng các class: `min-w-0`, `w-full`, `max-w-full`, `overflow-x-hidden` hoặc `overflow-hidden` trên các container cha.
    *   **Biên dịch ESM và CJS:** Dự án sử dụng `"type": "module"`. File `server.ts` sử dụng cú pháp ES Modules thông thường ở chế độ dev. Nhưng khi build Production, script `"build"` sẽ sử dụng `esbuild` để bundle toàn bộ `server.ts` cùng các module phụ thuộc thành một file CommonJS tự chứa duy nhất đặt tại `dist/server.cjs` nhằm vượt qua các ràng buộc import tương đối nghiêm ngặt của Node.js.
*   **Những phần không nên thay đổi nếu không cần thiết:**
    *   **Web Audio API Synth (`src/utils/audio.ts`):** Các tần số âm thanh Pentatonic (E5, B5, A5, E6) đã được tinh chỉnh tần số và thời gian giảm âm để tạo ra phản hồi âm thanh cực kỳ nịnh tai và dễ chịu, không nên đổi cấu trúc sóng nếu không cần thiết.
    *   **Giao diện Chọn chữ cái (`src/components/HiraganaChart.tsx`):** Cấu trúc layout bàn cờ cùng việc lọc bỏ âm trùng lặp đã được thiết kế tối ưu, chỉnh sửa có thể ảnh hưởng đến pool ký tự truyền vào các game kiểm tra phản xạ.

---

# 7. Next Tasks

Các đề xuất công việc tiếp theo được sắp xếp theo thứ tự ưu tiên giảm dần:

1.  **Bổ sung cơ sở dữ liệu bài học đầy đủ cho cấp độ N4 - N1:** 
    *   *Mô tả:* Hiện tại mới chỉ có N5 có dữ liệu tĩnh đầy đủ trong `lessons.ts`. Cần thu thập và khai báo thêm các bài học tiếp theo cho N4 để nâng tầm ứng dụng.
2.  **Xây dựng Canvas Vẽ tay tương tác (Stroke Order Canvas Drawing & Recognition):**
    *   *Mô tả:* Hiện tại Flashcard bảng chữ cái đã có chỉ dẫn các bước viết nét chữ bằng lời thoại cực kỳ chi tiết. Một tính năng cho phép người dùng dùng ngón tay/chuột vẽ trực tiếp lên một ô canvas ảo và tính toán độ khớp nét vẽ sẽ là sự bổ sung tuyệt vời.
3.  **Tích hợp AI Gemini đánh giá phát âm qua microphone:**
    *   *Mô tả:* Người dùng có thể đọc từ vựng tiếng Nhật qua micro, ứng dụng ghi âm lại và gửi lên server để Gemini so khớp độ chuẩn của phát âm thông qua API nhận diện giọng nói.
