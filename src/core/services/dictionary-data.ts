/**
 * Comprehensive Academic & Conversational English-Vietnamese Phonetic Dictionary.
 * Provides authentic IPA transcriptions, accurate Vietnamese definitions,
 * realistic example sentences, and 3D articulatory guidance.
 */

export interface WordDefinitionEntry {
  ipa: string;
  partOfSpeech: string;
  definitionVi: string;
  exampleSentenceEn: string;
  exampleSentenceVi: string;
  articulatoryTipVi: string;
}

export const ACADEMIC_DICTIONARY: Record<string, WordDefinitionEntry> = {
  power: {
    ipa: "ˈpaʊ.ər",
    partOfSpeech: "noun",
    definitionVi: "Sức mạnh, quyền lực, khả năng chi phối; năng lượng, điện lực.",
    exampleSentenceEn: "Knowledge gives you the power to shape your own future.",
    exampleSentenceVi: "Tri thức mang lại cho bạn sức mạnh để định hình tương lai của chính mình.",
    articulatoryTipVi: "Bật hơi dứt khoát âm /p/ ở đầu, lướt nguyên âm đôi /aʊ/ từ mở sang tròn môi, kết thúc bằng âm lướt /ər/ thả lỏng.",
  },
  good: {
    ipa: "ɡʊd",
    partOfSpeech: "adjective",
    definitionVi: "Tốt, hay, đạt chuẩn; có phẩm chất tốt hoặc mang lại lợi ích.",
    exampleSentenceEn: "Practicing pronunciation daily is a very good habit.",
    exampleSentenceVi: "Luyện phát âm hằng ngày là một thói quen rất tốt.",
    articulatoryTipVi: "Phát âm nguyên âm ngắn /ʊ/ (môi thả lỏng, hơi hé, không kéo dài thành /uː/), bật nhẹ âm /ɡ/ ở cuống họng và chạm răng cho âm /d/.",
  },
  think: {
    ipa: "θɪŋk",
    partOfSpeech: "verb",
    definitionVi: "Suy nghĩ, cân nhắc, tin rằng hoặc có ý kiến về điều gì.",
    exampleSentenceEn: "I think continuous learning is the key to mastery.",
    exampleSentenceVi: "Tôi nghĩ rằng việc học hỏi không ngừng là chìa khóa để đạt tới sự tinh thông.",
    articulatoryTipVi: "Đầu lưỡi kẹp nhẹ giữa hai hàm răng cho âm xát vô thanh /θ/, hơi thở thoát qua kẽ răng không rung dây thanh.",
  },
  articulation: {
    ipa: "ɑːˌtɪk.jəˈleɪ.ʃən",
    partOfSpeech: "noun",
    definitionVi: "Sự phát âm rõ ràng, chuẩn xác các âm vị trong giao tiếp.",
    exampleSentenceEn: "Clear articulation is vital for effective presentations.",
    exampleSentenceVi: "Phát âm rõ ràng là điều tối quan trọng đối với một bài thuyết trình hiệu quả.",
    articulatoryTipVi: "Nâng nhẹ đầu lưỡi chạm ngạc cứng cho âm /l/, mở rộng khẩu hình cho nguyên âm chính /eɪ/.",
  },
  resilience: {
    ipa: "rɪˈzɪl.jəns",
    partOfSpeech: "noun",
    definitionVi: "Khả năng phục hồi kiên cường sau khó khăn, nghịch cảnh.",
    exampleSentenceEn: "Courage and resilience help overcome difficult obstacles.",
    exampleSentenceVi: "Lòng can đảm và sự kiên cường giúp vượt qua các trở ngại gian nan.",
    articulatoryTipVi: "Rung dây thanh âm cho phụ âm /z/, đầu lưỡi nâng chạm gờ nướu răng trên.",
  },
  eloquent: {
    ipa: "ˈel.ə.kwənt",
    partOfSpeech: "adjective",
    definitionVi: "Có tài hùng biện, diễn đạt lưu loát và đầy sức thuyết phục.",
    exampleSentenceEn: "She gave an eloquent speech that moved the entire audience.",
    exampleSentenceVi: "Cô ấy đã có một bài phát biểu hùng biện lay động toàn bộ khán giả.",
    articulatoryTipVi: "Chu tròn môi chuẩn bị cho âm /w/, hạ hàm tự nhiên cho nguyên âm đầu /e/.",
  },
  serendipity: {
    ipa: "ˌser.ənˈdɪp.ə.ti",
    partOfSpeech: "noun",
    definitionVi: "Sự tình cờ may mắn phát hiện ra những điều thú vị, có giá trị.",
    exampleSentenceEn: "Finding this rare book was a moment of pure serendipity.",
    exampleSentenceVi: "Việc tìm thấy cuốn sách quý này là một sự tình cờ may mắn thuần túy.",
    articulatoryTipVi: "Nhấn trọng âm chính vào âm tiết thứ ba /ˈdɪp/, đầu lưỡi lướt nhẹ chạm nướu cho âm /r/ và /t/.",
  },
  ubiquitous: {
    ipa: "juːˈbɪk.wɪ.təs",
    partOfSpeech: "adjective",
    definitionVi: "Có mặt ở khắp mọi nơi, phổ biến cùng lúc.",
    exampleSentenceEn: "Smartphones have become ubiquitous in modern society.",
    exampleSentenceVi: "Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi trong xã hội hiện đại.",
    articulatoryTipVi: "Bắt đầu với bán nguyên âm /j/, kéo dài âm /uː/ rồi bật nhanh tổ hợp /kw/.",
  },
  meticulous: {
    ipa: "məˈtɪk.jə.ləs",
    partOfSpeech: "adjective",
    definitionVi: "Tỉ mỉ, cẩn thận, chăm chút đến từng chi tiết nhỏ.",
    exampleSentenceEn: "He was meticulous about keeping his laboratory notes accurate.",
    exampleSentenceVi: "Anh ấy rất tỉ mỉ trong việc giữ cho các ghi chép phòng thí nghiệm chính xác.",
    articulatoryTipVi: "Bật dứt khoát âm /t/ sau nguyên âm lướt /ə/, đầu lưỡi gõ nhẹ vào nướu răng trên.",
  },
  tenacious: {
    ipa: "təˈneɪ.ʃəs",
    partOfSpeech: "adjective",
    definitionVi: "Kiên trì, bền bỉ, quyết tâm không bỏ cuộc.",
    exampleSentenceEn: "Her tenacious effort finally led to a major scientific breakthrough.",
    exampleSentenceVi: "Nỗ lực bền bỉ của cô ấy cuối cùng đã mang lại bước đột phá khoa học lớn.",
    articulatoryTipVi: "Trọng âm rơi vào /neɪ/, chuyển mượt sang âm xát vòm miệng /ʃ/ với môi hơi chu về phía trước.",
  },
  ephemeral: {
    ipa: "ɪˈfem.ər.əl",
    partOfSpeech: "adjective",
    definitionVi: "Phù du, chóng tàn, chỉ tồn tại trong một khoảng thời gian rất ngắn.",
    exampleSentenceEn: "The morning mist was ephemeral, disappearing under the sun.",
    exampleSentenceVi: "Lớp sương sớm thật phù du, nhanh chóng tan biến dưới ánh mặt trời.",
    articulatoryTipVi: "Răng cửa trên chạm nhẹ môi dưới cho âm /f/, thả lỏng cơ miệng cho nguyên âm lướt /ər/.",
  },
  confidence: {
    ipa: "ˈkɒn.fɪ.dəns",
    partOfSpeech: "noun",
    definitionVi: "Sự tự tin, niềm tin vào năng lực bản thân hoặc người khác.",
    exampleSentenceEn: "Practice in front of the 3D mirror builds genuine speaking confidence.",
    exampleSentenceVi: "Luyện tập trước gương 3D giúp xây dựng sự tự tin nói tiếng Anh thực sự.",
    articulatoryTipVi: "Bật mạnh âm /k/ ở cuống họng, hạ hàm tự nhiên cho nguyên âm ngắn /ɒ/.",
  },
  innovation: {
    ipa: "ˌɪn.əˈveɪ.ʃən",
    partOfSpeech: "noun",
    definitionVi: "Sự đổi mới, sáng kiến cải tiến phương pháp hoặc công nghệ.",
    exampleSentenceEn: "Technological innovation drives progress across all industries.",
    exampleSentenceVi: "Đổi mới công nghệ thúc đẩy sự tiến bộ trong mọi ngành công nghiệp.",
    articulatoryTipVi: "Răng trên chạm môi dưới cho âm /v/, kết thúc bằng đuôi /-ʃən/ nhẹ nhàng và dứt khoát.",
  },
  perspective: {
    ipa: "pəˈspek.tɪv",
    partOfSpeech: "noun",
    definitionVi: "Góc nhìn, quan điểm; cách nhìn nhận đánh giá sự việc.",
    exampleSentenceEn: "Traveling gives people a broader perspective on the world.",
    exampleSentenceVi: "Đi du lịch mang lại cho con người một góc nhìn rộng mở hơn về thế giới.",
    articulatoryTipVi: "Bật nhẹ /p/, khép răng cho âm /s/ rồi chuyển sang cụm phụ âm /kt/ dứt khoát.",
  },
  sustainable: {
    ipa: "səˈsteɪ.nə.bəl",
    partOfSpeech: "adjective",
    definitionVi: "Bền vững, có thể duy trì lâu dài mà không gây tổn hại.",
    exampleSentenceEn: "We need sustainable solutions to protect the environment.",
    exampleSentenceVi: "Chúng ta cần những giải pháp bền vững để bảo vệ môi trường.",
    articulatoryTipVi: "Khép răng cho âm đầu /s/, nhấn trọng âm vào /steɪ/ và kết thúc bằng âm /bəl/ với đầu lưỡi nâng chạm nướu.",
  },
  hello: {
    ipa: "həˈləʊ",
    partOfSpeech: "interjection",
    definitionVi: "Lời chào hỏi thân thiện khi gặp gỡ hoặc bắt đầu cuộc trò chuyện.",
    exampleSentenceEn: "Hello! It is wonderful to meet you today.",
    exampleSentenceVi: "Xin chào! Thật tuyệt vời khi được gặp bạn hôm nay.",
    articulatoryTipVi: "Bật nhẹ luồng hơi qua thanh môn cho âm /h/, lướt nguyên âm đôi /əʊ/ từ khẩu hình mở tự nhiên đến môi khẽ thu tròn.",
  },
  world: {
    ipa: "wɜːld",
    partOfSpeech: "noun",
    definitionVi: "Thế giới, địa cầu, nhân loại hoặc không gian xã hội xung quanh.",
    exampleSentenceEn: "English opens up opportunities to connect with the entire world.",
    exampleSentenceVi: "Tiếng Anh mở ra những cơ hội để kết nối với toàn thế giới.",
    articulatoryTipVi: "Chu tròn môi cho âm /w/, nâng giữa lưỡi cho nguyên âm dài /ɜː/, kết thúc bằng tổ hợp /ld/ dứt khoát.",
  },
  english: {
    ipa: "ˈɪŋ.ɡlɪʃ",
    partOfSpeech: "noun",
    definitionVi: "Tiếng Anh, ngôn ngữ giao tiếp quốc tế phổ biến nhất hành tinh.",
    exampleSentenceEn: "Fluency in English empowers personal and professional growth.",
    exampleSentenceVi: "Sự lưu loát tiếng Anh tiếp thêm sức mạnh cho sự phát triển cá nhân và sự nghiệp.",
    articulatoryTipVi: "Hạ hàm nhẹ cho nguyên âm ngắn /ɪ/, nâng gốc lưỡi chạm ngạc mềm cho /ŋɡ/, kết thúc với âm xát tròn môi /ʃ/.",
  },
  speak: {
    ipa: "spiːk",
    partOfSpeech: "verb",
    definitionVi: "Nói, diễn đạt ý nghĩ và cảm xúc thành lời qua giọng nói.",
    exampleSentenceEn: "Speak clearly and confidently to deliver your message effectively.",
    exampleSentenceVi: "Hãy nói rõ ràng và tự tin để truyền tải thông điệp của bạn hiệu quả.",
    articulatoryTipVi: "Khép răng cho âm /s/, bật nhẹ /p/, căng khóe môi sang hai bên cho nguyên âm dài /iː/, kết thúc bằng /k/.",
  },
  listen: {
    ipa: "ˈlɪs.ən",
    partOfSpeech: "verb",
    definitionVi: "Lắng nghe, chăm chú đón nhận âm thanh để thấu hiểu thông tin.",
    exampleSentenceEn: "Active listening is essential for improving spoken pronunciation.",
    exampleSentenceVi: "Lắng nghe chủ động là điều cốt lõi để nâng cao phát âm khi nói.",
    articulatoryTipVi: "Đầu lưỡi chạm nướu trên cho /l/, âm /t/ bị câm trong từ này, kết thúc bằng âm lướt nhẹ /s.ən/.",
  },
  practice: {
    ipa: "ˈpræk.tɪs",
    partOfSpeech: "noun",
    definitionVi: "Luyện tập, thực hành liên tục nhằm rèn luyện kỹ năng thành thạo.",
    exampleSentenceEn: "Deliberate practice every single day guarantees rapid mastery.",
    exampleSentenceVi: "Luyện tập có chủ đích mỗi ngày đảm bảo sự tiến bộ vượt bậc.",
    articulatoryTipVi: "Bật dứt khoát tổ hợp /pr/, mở rộng miệng theo chiều dọc cho nguyên âm bẹt /æ/, chuyển nhanh sang /kt/.",
  },
  pronunciation: {
    ipa: "prəˌnʌn.siˈeɪ.ʃən",
    partOfSpeech: "noun",
    definitionVi: "Sự phát âm, cách cấu âm chính xác của các âm vị trong ngôn ngữ.",
    exampleSentenceEn: "Accurate pronunciation gives learners high confidence in communication.",
    exampleSentenceVi: "Phát âm chuẩn xác đem lại cho người học sự tự tin cao độ trong giao tiếp.",
    articulatoryTipVi: "Trọng âm chính rơi vào /eɪ/, lưu ý âm tiết thứ hai là /nʌn/ chứ không đọc nhầm thành /naʊn/.",
  },
  fluent: {
    ipa: "ˈfluː.ənt",
    partOfSpeech: "adjective",
    definitionVi: "Lưu loát, trôi chảy, sử dụng ngôn ngữ một cách tự nhiên và dễ dàng.",
    exampleSentenceEn: "With dedicated daily practice, you will become fluent in English.",
    exampleSentenceVi: "Với sự luyện tập tận tâm hằng ngày, bạn sẽ nói tiếng Anh trôi chảy.",
    articulatoryTipVi: "Lướt mượt mà từ âm xát môi-răng /f/ sang âm cạnh lưỡi /l/, chu môi cho nguyên âm dài /uː/.",
  },
  vocabulary: {
    ipa: "vəˈkæb.jə.lər.i",
    partOfSpeech: "noun",
    definitionVi: "Vốn từ vựng, tập hợp các từ ngữ trong một ngôn ngữ hoặc của cá nhân.",
    exampleSentenceEn: "Expanding your active vocabulary accelerates natural conversation.",
    exampleSentenceVi: "Mở rộng vốn từ vựng chủ động giúp đẩy nhanh khả năng hội thoại tự nhiên.",
    articulatoryTipVi: "Răng trên chạm nhẹ môi dưới cho /v/, nhấn trọng âm chính vào nguyên âm bẹt /kæb/.",
  },
  challenge: {
    ipa: "ˈtʃæl.ɪndʒ",
    partOfSpeech: "noun",
    definitionVi: "Thử thách, tình huống đòi hỏi nỗ lực và ý chí kiên định để vượt qua.",
    exampleSentenceEn: "Embrace every speaking challenge as an opportunity to grow.",
    exampleSentenceVi: "Hãy đón nhận mọi thử thách khi nói như một cơ hội quý báu để trưởng thành.",
    articulatoryTipVi: "Bật âm tắc xát vô thanh /tʃ/ ở đầu, mở miệng cho /æ/ và kết thúc bằng âm tắc xát hữu thanh /dʒ/ rung dây thanh.",
  },
  opportunity: {
    ipa: "ˌɒp.əˈtjuː.nə.ti",
    partOfSpeech: "noun",
    definitionVi: "Cơ hội, thời cơ thuận lợi để thực hiện dự định và đạt thành công.",
    exampleSentenceEn: "Every conversation is a new opportunity to polish your accent.",
    exampleSentenceVi: "Mỗi cuộc trò chuyện là một cơ hội mới để hoàn thiện ngữ điệu của bạn.",
    articulatoryTipVi: "Trọng âm rơi vào /tjuː/ (chu môi căng), kết thúc bằng các âm tiết lướt nhẹ nhàng /nə.ti/.",
  },
  success: {
    ipa: "səkˈses",
    partOfSpeech: "noun",
    definitionVi: "Sự thành công, kết quả tốt đẹp và viên mãn sau nỗ lực bền bỉ.",
    exampleSentenceEn: "Consistency is the single greatest secret of speaking success.",
    exampleSentenceVi: "Sự kiên trì đều đặn là bí quyết số một của thành công trong luyện nói.",
    articulatoryTipVi: "Âm đầu là nguyên âm lướt /sək/, trọng âm chính nhấn mạnh vào âm tiết thứ hai /ses/.",
  },
  knowledge: {
    ipa: "ˈnɒl.ɪdʒ",
    partOfSpeech: "noun",
    definitionVi: "Tri thức, hiểu biết sâu rộng thu nhận được qua học vấn và trải nghiệm.",
    exampleSentenceEn: "Sharing knowledge enriches both the speaker and the listener.",
    exampleSentenceVi: "Chia sẻ tri thức làm giàu cho cả người nói lẫn người nghe.",
    articulatoryTipVi: "Phụ âm k bị câm, phát âm bắt đầu bằng /n/, hạ hàm cho /ɒ/ và kết thúc bằng âm tắc xát /dʒ/.",
  },
  experience: {
    ipa: "ɪkˈspɪə.ri.əns",
    partOfSpeech: "noun",
    definitionVi: "Kinh nghiệm thực tiễn, trải nghiệm quý báu tích lũy theo thời gian.",
    exampleSentenceEn: "Hands-on experience speaking with AI builds muscle memory quickly.",
    exampleSentenceVi: "Kinh nghiệm thực chiến luyện nói cùng AI giúp hình thành trí nhớ cơ bắp nhanh chóng.",
    articulatoryTipVi: "Nhấn trọng âm vào /spɪə/ với nguyên âm đôi lướt từ hẹp /ɪ/ sang thả lỏng /ə/.",
  },
  community: {
    ipa: "kəˈmjuː.nə.ti",
    partOfSpeech: "noun",
    definitionVi: "Cộng đồng, tập thể xã hội có chung tiếng nói hoặc mục đích cao đẹp.",
    exampleSentenceEn: "A supportive community inspires learners to overcome language anxiety.",
    exampleSentenceVi: "Một cộng đồng tương trợ truyền cảm hứng giúp người học vượt qua nỗi sợ ngoại ngữ.",
    articulatoryTipVi: "Bắt đầu với /kə/, nhấn trọng âm mạnh mẽ vào tổ hợp /mjuː/ với môi chu tròn.",
  },
  technology: {
    ipa: "tekˈnɒl.ə.dʒi",
    partOfSpeech: "noun",
    definitionVi: "Công nghệ tiên tiến, việc ứng dụng khoa học kỹ thuật vào thực tiễn đời sống.",
    exampleSentenceEn: "Modern AI technology revolutionizes personalized language education.",
    exampleSentenceVi: "Công nghệ AI hiện đại cách mạng hóa phương pháp giáo dục ngôn ngữ cá nhân hóa.",
    articulatoryTipVi: "Bật dứt khoát /tek/, nhấn trọng âm vào /nɒl/, kết thúc với âm tắc xát nhẹ /dʒi/.",
  },
  apple: {
    ipa: "ˈæp.əl",
    partOfSpeech: "noun",
    definitionVi: "Quả táo, loại quả ngọt giòn phổ biến và bổ dưỡng.",
    exampleSentenceEn: "An apple a day keeps the doctor away.",
    exampleSentenceVi: "Mỗi ngày ăn một quả táo giúp cơ thể luôn khỏe mạnh.",
    articulatoryTipVi: "Mở rộng khẩu hình theo chiều dọc cho nguyên âm bẹt /æ/, mím môi bật nhẹ /p/ và kết thúc bằng âm bên /əl/.",
  },
  book: {
    ipa: "bʊk",
    partOfSpeech: "noun",
    definitionVi: "Cuốn sách, tác phẩm chứa đựng tri thức và tư tưởng của con người.",
    exampleSentenceEn: "She loves reading an inspiring book before sleeping.",
    exampleSentenceVi: "Cô ấy thích đọc một cuốn sách truyền cảm hứng trước khi đi ngủ.",
    articulatoryTipVi: "Nguyên âm ngắn /ʊ/ thả lỏng (không chu căng môi như /uː/), bật dứt khoát phụ âm cuối /k/.",
  },
  computer: {
    ipa: "kəmˈpjuː.tər",
    partOfSpeech: "noun",
    definitionVi: "Máy vi tính, thiết bị điện tử xử lý và lưu trữ dữ liệu kỹ thuật số.",
    exampleSentenceEn: "A modern computer is an indispensable tool for study and research.",
    exampleSentenceVi: "Máy tính hiện đại là công cụ không thể thiếu cho học tập và nghiên cứu.",
    articulatoryTipVi: "Âm tiết đầu nhẹ nhàng /kəm/, nhấn trọng âm mạnh vào /pjuː/ với môi chu tròn, âm cuối thả lỏng /tər/.",
  },
  family: {
    ipa: "ˈfæm.əl.i",
    partOfSpeech: "noun",
    definitionVi: "Gia đình, tổ ấm gắn kết tình thương yêu giữa những người thân ruột thịt.",
    exampleSentenceEn: "Family is a priceless foundation for encouragement and peace.",
    exampleSentenceVi: "Gia đình là nền tảng vô giá mang lại sự động viên và bình yên.",
    articulatoryTipVi: "Răng trên chạm môi dưới cho /f/, mở miệng cho nguyên âm bẹt /æ/, chuyển mượt qua /m.əl.i/.",
  },
  friend: {
    ipa: "frend",
    partOfSpeech: "noun",
    definitionVi: "Người bạn, người tri kỷ sẻ chia niềm vui và đồng hành trong cuộc sống.",
    exampleSentenceEn: "A loyal friend is one of life's greatest treasures.",
    exampleSentenceVi: "Một người bạn chân thành là một trong những kho báu quý giá nhất của cuộc đời.",
    articulatoryTipVi: "Lướt nhanh từ âm xát /f/ sang âm cuộn lưỡi /r/, hạ hàm cho /e/, kết thúc bằng tổ hợp /nd/ rõ ràng.",
  },
  focus: {
    ipa: "ˈfəʊ.kəs",
    partOfSpeech: "noun",
    definitionVi: "Sự tập trung, định hướng toàn bộ chú ý và nỗ lực vào mục tiêu chính.",
    exampleSentenceEn: "Deep focus during pronunciation practice delivers noticeable improvement.",
    exampleSentenceVi: "Sự tập trung cao độ khi luyện phát âm mang lại sự tiến bộ rõ rệt.",
    articulatoryTipVi: "Răng chạm nhẹ môi cho /f/, nguyên âm đôi /əʊ/ khẽ thu tròn môi, kết thúc với âm xát /s/.",
  },
  creativity: {
    ipa: "ˌkriː.eɪˈtɪv.ə.ti",
    partOfSpeech: "noun",
    definitionVi: "Khả năng sáng tạo, tư duy phong phú tạo nên những ý tưởng mới mẻ.",
    exampleSentenceEn: "Creativity transforms complex language study into joyful discovery.",
    exampleSentenceVi: "Sự sáng tạo biến việc học ngoại ngữ phức tạp thành cuộc khám phá đầy hứng khởi.",
    articulatoryTipVi: "Trọng âm chính rơi vào /tɪv/, phát âm dứt khoát phụ âm /t/ với đầu lưỡi gõ vào chân răng trên.",
  },
  passion: {
    ipa: "ˈpæʃ.ən",
    partOfSpeech: "noun",
    definitionVi: "Niềm đam mê cháy bỏng, ngọn lửa nhiệt huyết dành cho một hoài bão.",
    exampleSentenceEn: "Passion and perseverance will carry you across the finish line.",
    exampleSentenceVi: "Đam mê và sự kiên trì sẽ đưa bạn vượt qua vạch đích thành công.",
    articulatoryTipVi: "Bật dứt khoát /p/, mở rộng khẩu hình cho /æ/, chu môi đẩy luồng hơi mạnh cho âm xát /ʃ/.",
  },
  journey: {
    ipa: "ˈdʒɜː.ni",
    partOfSpeech: "noun",
    definitionVi: "Hành trình, chặng đường trải nghiệm và phát triển bản thân.",
    exampleSentenceEn: "Mastering spoken English is an exciting lifelong journey.",
    exampleSentenceVi: "Làm chủ tiếng Anh nói là một hành trình thú vị kéo dài suốt đời.",
    articulatoryTipVi: "Bật âm tắc xát /dʒ/ tròn môi rung thanh quản, kéo dài nguyên âm dài /ɜː/, kết thúc với /ni/.",
  },
  future: {
    ipa: "ˈfjuː.tʃər",
    partOfSpeech: "noun",
    definitionVi: "Tương lai, thời gian và viễn cảnh rộng mở ở phía trước.",
    exampleSentenceEn: "Your daily dedication today determines your bright speaking future.",
    exampleSentenceVi: "Sự tận tâm hằng ngày hôm nay quyết định một tương lai nói tiếng Anh rạng rỡ.",
    articulatoryTipVi: "Lướt từ /f/ sang bán nguyên âm /j/, kéo dài /uː/, kết thúc bằng âm tắc xát vô thanh /tʃər/.",
  },
  culture: {
    ipa: "ˈkʌl.tʃər",
    partOfSpeech: "noun",
    definitionVi: "Nền văn hóa, hệ giá trị và phong tục truyền thống tốt đẹp của xã hội.",
    exampleSentenceEn: "Learning a language immerses you directly into a fascinating new culture.",
    exampleSentenceVi: "Học một ngôn ngữ đưa bạn hòa mình trực tiếp vào một nền văn hóa mới đầy cuốn hút.",
    articulatoryTipVi: "Bật âm /k/ ở cuống họng, phát âm nguyên âm ngắn /ʌ/, nâng lưỡi cho /l/ rồi bật /tʃər/ dứt khoát.",
  },
  smart: {
    ipa: "smɑːt",
    partOfSpeech: "adjective",
    definitionVi: "Thông minh, nhanh trí, khéo léo và nhạy bén trong suy nghĩ.",
    exampleSentenceEn: "Using spaced repetition is a smart strategy for long-term retention.",
    exampleSentenceVi: "Sử dụng kỹ thuật lặp lại ngắt quãng là một chiến lược thông minh để ghi nhớ dài hạn.",
    articulatoryTipVi: "Khép răng cho /s/, mím môi /m/, mở rộng miệng cho nguyên âm dài /ɑː/ và chạm răng cho âm cuối /t/.",
  },
};

/**
 * Searches word in the academic phonetic dictionary with normalization.
 */
export function lookupAcademicDictionary(word: string): WordDefinitionEntry | null {
  const normalized = word.trim().toLowerCase();
  if (ACADEMIC_DICTIONARY[normalized]) {
    return ACADEMIC_DICTIONARY[normalized] ?? null;
  }
  // Try singular form if word ends with 's' or 'es'
  if (normalized.endsWith("s") && ACADEMIC_DICTIONARY[normalized.slice(0, -1)]) {
    return ACADEMIC_DICTIONARY[normalized.slice(0, -1)] ?? null;
  }
  return null;
}

