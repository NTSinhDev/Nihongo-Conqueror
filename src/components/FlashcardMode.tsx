import React, { useRef, useEffect, useState } from "react";
import { HiraganaChar } from "../data/hiragana";
import { speakJapanese, sounds } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Trash2,
  Check,
} from "lucide-react";

interface Properties {
  activeCharPool: HiraganaChar[];
  characterSet: "hiragana" | "katakana";
}

const STROKE_GUIDES: Record<string, { strokes: number; sequence: string[] }> = {
  "あ": { strokes: 3, sequence: ["Nét 1: Ngang ngắn từ trái sang phải", "Nét 2: Sổ dọc đứng hơi cong nghiêng nhẹ qua trung điểm", "Nét 3: Nét thắt xiên bên dưới quấn bọc cung tròn to nở hở trái"] },
  "い": { strokes: 2, sequence: ["Nét 1: Kéo một vệt thẳng đứng nhẹ bên trái rồi móc nhọn lên ở cuối", "Nét 2: Kéo nét ngắn song song đứng bên phải chếch chéo xiên"] },
  "う": { strokes: 2, sequence: ["Nét 1: Chấm một phẩy xiên nhỏ phía trên lệch phải", "Nét 2: Điểm một nét cong vòm lớn bọc phình bên sườn mông phải"] },
  "え": { strokes: 2, sequence: ["Nét 1: Chấm xiên ngắn góc phải đỉnh cao đầu", "Nét 2: Chạy nét gãy gấp chữ Z trượt phẳng nhô rồi lượn sải ngang đáy sườn"] },
  "お": { strokes: 3, sequence: ["Nét 1: Ngang mỏng ngắn ngang tâm trái", "Nét 2: Sổ đứng chẻ thẳng đi xuống thắt xéo quấn tròn vồng cung nở rộng", "Nét 3: Chấm nghiêng ngắn góc trên phải"] },
  "か": { strokes: 3, sequence: ["Nét 1: Cong lượn sườn ngang uốn đứng móc xiên trái nhọn hoắt", "Nét 2: Sổ xiên bổ thẳng cao dài xiên chéo rọi đứng cắt ngang", "Nét 3: Chấm nét nghiêng nhỏ bên phải"] },
  "き": { strokes: 4, sequence: ["Nét 1: Phẳng ngang trên ngắn", "Nét 2: Phẳng ngang dưới song song sải dài hơn kề sát", "Nét 3: Trục sổ xiên đứng chẻ đôi hai vệt hất chéo chóp lê", "Nét 4: Cung tròn đáy mở úp hờ"] },
  "く": { strokes: 1, sequence: ["Nét 1: Viết góc gập nhọn chĩa xiên chéo trái tựa như dấu bé thua (<)"] },
  "け": { strokes: 3, sequence: ["Nét 1: Sổ dọc mượt cong trái nhẹ rồi móc thóp đuôi chéo", "Nét 2: Ngang phẳng ngắn góc phải sườn trung", "Nét 3: Sổ đứng thẳng xẻ thẳng kéo qua nét ngang cong nhẹ trái"] },
  "こ": { strokes: 2, sequence: ["Nét 1: Ngang phẳng cong trên vát ngược nhúm móc", "Nét 2: Ngang sườn chân đáy phẳng ngửa dốc xiên nhẹ"] },
  "さ": { strokes: 3, sequence: ["Nét 1: Ngang xiên lên mỏng góc trái", "Nét 2: Sổ đứng xiên tạt qua hất nhọn mũi góc trái", "Nét 3: Cung nôi gạt đỡ ngửa dưới hướng lên"] },
  "し": { strokes: 1, sequence: ["Nét 1: Trục bổ dốc thẳng từ trên sút xuống rồi uốn cong tròn vút lên góc phải kề mỏ câu"] },
  "す": { strokes: 2, sequence: ["Nét 1: Ngang dài phẳng phiu sải phẳng rộng mép ngang", "Nét 2: Sổ xọc sút thẳng cắt ngang nhúm xoắn thắt nút tròn vắt xiên trái tạt đứng"] },
  "せ": { strokes: 3, sequence: ["Nét 1: Ngang sải rộng góc phẳng xiên lên nhẹ", "Nét 2: Đứng sổ thẳng sườn trong móc gập xiên phẳng trái", "Nét 3: Sổ đứng cột trái uốn bẹt chân tạt sườn sang phải"] },
  "そ": { strokes: 1, sequence: ["Nét 1: Vẽ zic-zac gãy chóp Z trên uốn liền nét cung hở tròn mông trống trái"] },
  "た": { strokes: 4, sequence: ["Nét 1: Ngang sườn ngắn lướt trái", "Nét 2: Sổ xiên tạt thẳng thốc chéo tạo cộng thập chéo", "Nét 3: Ngang nhỏ mỏng song trên phải", "Nét 4: Ngang nhỏ song sườn chân đáy phải"] },
  "ち": { strokes: 2, sequence: ["Nét 1: Ngang sải trung vừa xiên nhẹ cao", "Nét 2: Sổ đứng xiên cắt ngang vươn xiên vòng phồng mông hở góc như dạng số 5"] },
  "つ": { strokes: 1, sequence: ["Nét 1: Trườn tròn xiên ngang phồng béo gót trái rồi uốn sải vòng thoải chéo góc phải dưới"] },
  "て": { strokes: 1, sequence: ["Nét 1: Đi ngang nhô chéo rồi bẻ hông uốn cong vạt mở tròn hướng hạ xiên chéo"] },
  "と": { strokes: 2, sequence: ["Nét 1: Chọc xiên chéo nhọn xiên chĩa lệch góc xiên phải dốc", "Nét 2: Vẽ vòm mông khuyết C sườn gót tạt ôm dính chân nhọn nét đầu"] },
  "な": { strokes: 4, sequence: ["Nét 1: Ngang ngắn mỏng sườn trái", "Nét 2: Sổ thẳng bổ đứng chẻ chéo vệt ngắn", "Nét 3: Điểm râu chấm nhỏ ti hí xiên lệch trên chóp chừa", "Nét 4: Sổ vòng lượn ở kẽ dưới thắt nút cuộn tròn nơ đuôi cá góc phải"] },
  "ni": { strokes: 3, sequence: ["Nét 1: Trục đứng thẳng xẻ thẳng sút đứng móc nhấc nhẹ chỏm chân", "Nét 2: Ngang ngắn song trên phẳng kề phải", "Nét 3: Ngang ngắn song dưới phẳng chân đáy kề trái"] },
  "に": { strokes: 3, sequence: ["Nét 1: Trục đứng thẳng xẻ thẳng sút đứng móc nhấc nhẹ chỏm chân", "Nét 2: Ngang ngắn song trên phẳng kề phải", "Nét 3: Ngang ngắn song dưới phẳng chân đáy kề trái"] },
  "ぬ": { strokes: 2, sequence: ["Nét 1: Điên xiên tạt sút từ sườn trung chui xiên xéo chéo nắp trái", "Nét 2: Khum lượn uốn võng vòn cắt trục xiên mút quấn tròn vắt nơ nốt thắt mép ngoài"] },
  "ね": { strokes: 2, sequence: ["Nét 1: Sổ đứng vút trục đứng cực phẳng lẹm thẳng đuôi", "Nét 2: Kéo nét lượn chữ Z chéo bổ qua trục uốn thắt nút xoắn cung cá phải dưới"] },
  "の": { strokes: 1, sequence: ["Nét 1: Sổ xiên mỏng nhẹ phải rồi o xiên lượn vồng che đóng kín nắp ốc uốn rỗng lòng"] },
  "は": { strokes: 3, sequence: ["Nét 1: Cột đứng sút bổ trái móc vút lên ngược chân", "Nét 2: Ngang ngắn mỏng chừa kẽ sườn trên chóp phải", "Nét 3: Sổ thẳng chẻ chóp xuyên sườn thắt nút tròn vặn xiên trái thanh mãnh"] },
  "ひ": { strokes: 1, sequence: ["Nét 1: Ngang mỏng nhô bơi hai võng tai phình lõm võng nôi mông rọi nhấc cao dốc xuôi"] },
  "ふ": { strokes: 4, sequence: ["Nét 1: Đỉnh mỏ câu lượn thắt mác nhọn", "Nét 2: Trục gót cong mở xiên xê dốc xéo trái dưới", "Nét 3: Point chấm râu vát bay bay mép chéo xiên trái", "Nét 4: Point chấm râu vát bay dốc xuôi xiên mép phải"] },
  "へ": { strokes: 1, sequence: ["Nét 1: Vút đỉnh sườn leo lượn dốc ngắn nhô xiên gấp rồi sải dài dốc chéo vát sườn phải"] },
  "ほ": { strokes: 4, sequence: ["Nét 1: Trục đứng trái phẳng đứng móc ngược khum nhúm", "Nét 2: Sọc ngang trên sườn kề song", "Nét 3: Sọc ngang dưới vắt trong kề song chừa", "Nét 4: Sổ đứng cắt đôi ngang thắt nút quấn tròn đuôi xiên trái"] },
  "ま": { strokes: 3, sequence: ["Nét 1: Ngang trên phẳng phẳng", "Nét 2: Ngang dưới phẳng song nằm kề dưới", "Nét 3: Sổ thẳng xuyên cắt đôi 2 vệt xiên quấn thắt thóp tròn mép chèo trái"] },
  "み": { strokes: 2, sequence: ["Nét 1: Kéo ngang trượt gập tạt rốn uốn nút tròn rồi thẳng xéo mượt chèo xiên", "Nét 2: Dải sọc xéo hất đứng tạt phập góc cắt chéo kề cạnh"] },
  "む": { strokes: 3, sequence: ["Nét 1: Phẳng sườn mỏng xiên lướt trái", "Nét 2: Sổ trục đứng vồng thắt tròn quấn rốn phồng nhô lệch móc hất chóp xiên", "Nét 3: Chấm nét nghiêng nhỏ bay góc đầu đuôi phải"] },
  "め": { strokes: 2, sequence: ["Nét 1: Sút xiên tạt cong trượt sút chéo kẽ trái", "Nét 2: Vẽ sườn vòm xiên rọi tạt lấn trục dọc uốn vòng cong kín sườn vút nhô chèo"] },
  "も": { strokes: 3, sequence: ["Nét 1: Móc lưỡi câu đứng vút cong tạc nẩng bẹt chân ngửa góc phải", "Nét 2: Chĩa vẹt ngang trên rọi chẻ trục", "Nét 3: Chĩa vẹt ngang dưới rọi chẻ song song kề gót"] },
  "や": { strokes: 3, sequence: ["Nét 1: Vòng lượn vách đá bò lấn tròn móc gót chọc nhọn", "Nét 2: Phẩy dấu tăm xiên chéo kẽ đá", "Nét 3: Sổ xiên trục rọi lướt dậm thẳng qua thành cung đá"] },
  "ゆ": { strokes: 2, sequence: ["Nét 1: Vẽ vành tai sườn phình xéo lõm mông uốn gấp thẳng gót", "Nét 2: Trục sổ đứng đứng chẻ xuyên cắt sườn bầu mông nắp"] },
  "よ": { strokes: 2, sequence: ["Nét 1: Ngang sườn phẳng sát ngắn phẳng", "Nét 2: Sổ dọc sút thẳng xuyên ngang xoắn uốn thắt dẹp rốn mép góc trái"] },
  "ら": { strokes: 2, sequence: ["Nét 1: Chấm chỏm nón chéo góc trên chóp", "Nét 2: Kéo sườn neo xéo vồng mông phính hở trái lượn mượt"] },
  "り": { strokes: 2, sequence: ["Nét 1: Nhánh trái xiên đứng ngắn khom cong móc thóp nhấc chỏm", "Nét 2: Nhánh phải sút đứng dọc dài sụn dốc khum mượt trái"] },
  "る": { strokes: 1, sequence: ["Nét 1: Vẽ lượn chữ Z sải đáy phẳng xoay trượt uốn xoắn nút tròn cuộn thắt kĩ rốn rìa chân"] },
  "れ": { strokes: 2, sequence: ["Nét 1: Trực dọc rọi đứng mượt sâu chân phẳng phiu", "Nét 2: Kéo nét gãy Z xuyên cắt rồi hớt bếch móc chĩa nhọn ngoài rìa góc phải"] },
  "ろ": { strokes: 1, sequence: ["Nét 1: Vẽ lượn chữ Z trượt phẳng uốn lượn mông rỗng hở bụng trái giống る nhưng không thắt nút xoắn đầu rìa"] },
  "わ": { strokes: 2, sequence: ["Nét 1: Trực cột đứng mép trái cực phẳng sút mượt", "Nét 2: Vẽ sóng gấp Z xuyên tạt uốn cong tròn phồng béo hở bụng góc phải rộng"] },
  "を": { strokes: 3, sequence: ["Nét 1: Sọc ngang sườn ngắn phẳng phiu", "Nét 2: Sổ dọc xiên thẳng tạt ngang dẹp rồi gập xéo xiên chéo phải", "Nét 3: Vành sườn cong tròn uốn gót ngửa rỗng dưới mông khuyết sườn"] },
  "ん": { strokes: 1, sequence: ["Nét 1: Trượt xiên gốc lùi rồi dâng gập lượn sóng võng vồng cánh chim vút chóp dốc xiên chéo phải"] },
  // Basic Katakana Stroke Guides
  "ア": { strokes: 2, sequence: ["Nét 1: Kéo sọc ngang lướt ngắn rồi gập xiên uốn mượt hông trái rọi cong", "Nét 2: Phẩy vuốt dài đứng bên dưới xuyên chéo điểm chóp"] },
  "イ": { strokes: 2, sequence: ["Nét 1: Nghiêng xiên dốc sút nhẹ từ trên xuống trái", "Nét 2: Trục đứng thẳng cột đứng cắt xiên ngang lòng nét 1"] },
  "ウ": { strokes: 3, sequence: ["Nét 1: Phẩy nhỏ dốc đứng trên mác", "Nét 2: Chọc ngang dứt ngang gập lượn", "Nét 3: Nghiêng xiên nhọn từ sườn phải móc lót lòng nét 1"] },
  "エ": { strokes: 3, sequence: ["Nét 1: Đi ngang mỏng phẳng sườn trên", "Nét 2: Sổ đứng thẳng chẻ dọc đôi tim phẳng", "Nét 3: Đi ngang phẳng và sải dốc đáy rộng bao gốc trục đứng"] },
  "オ": { strokes: 3, sequence: ["Nét 1: Sọc sải ngang mỏng qua vai", "Nét 2: Sổ dọc sút bổ chẻ đứng gập móc nhô bết xéo trái", "Nét 3: Chấm đứng xéo lửng sườn bay bên phải"] }
};

export default function FlashcardMode({ activeCharPool, characterSet }: Properties) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sync state if char pool changes or shrinks
  useEffect(() => {
    if (index >= activeCharPool.length) {
      setIndex(0);
    }
  }, [activeCharPool, index]);

  const currentChar: HiraganaChar | undefined = activeCharPool[index];

  // Auto pronunciation when character changes
  useEffect(() => {
    if (currentChar && autoSpeak) {
      // Speak with a slight delay so user can expect it
      const timer = setTimeout(() => {
        speakJapanese(currentChar.hiragana);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentChar, autoSpeak]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeCharPool.length === 0) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, activeCharPool]);

  // Reset drawing canvas when character changes or manually requested
  useEffect(() => {
    clearCanvas();
  }, [currentChar]);

  // Audio trigger
  const handleAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentChar) {
      speakJapanese(currentChar.hiragana);
    }
  };

  const handleFlip = () => {
    sounds.playClick();
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    if (activeCharPool.length === 0) return;
    sounds.playClick();
    setIsFlipped(false);
    setIndex((prev) => (prev + 1) % activeCharPool.length);
  };

  const handlePrev = () => {
    if (activeCharPool.length === 0) return;
    sounds.playClick();
    setIsFlipped(false);
    setIndex((prev) => (prev - 1 + activeCharPool.length) % activeCharPool.length);
  };

  const handleRandomize = () => {
    if (activeCharPool.length <= 1) return;
    sounds.playClick();
    setIsFlipped(false);
    let newIndex = index;
    // ensure next is indeed different
    while (newIndex === index) {
      newIndex = Math.floor(Math.random() * activeCharPool.length);
    }
    setIndex(newIndex);
  };

  // Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    
    // Support mouse and touch coordinate retrieval
    const coordinates = getCoordinates(e, canvas);
    ctx.moveTo(coordinates.x, coordinates.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coordinates = getCoordinates(e, canvas);
    ctx.lineTo(coordinates.x, coordinates.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  type PointerEvent = React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>;

  // FIX: Recalculate and scale coordinates accurately relative to the actual display bounding client rect
  const getCoordinates = (e: PointerEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    
    // Check if TouchEvent
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Proportional scaling factor from layout render box to internal drawing context grid (280x280)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: relativeX * scaleX,
      y: relativeY * scaleY,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set smooth styling for tracing lines
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#e11d48"; // Rose-600
  };

  // If pool is empty
  if (activeCharPool.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs max-w-lg mx-auto">
        <span className="text-4xl mb-4">🎴</span>
        <h3 className="text-lg font-semibold text-stone-800">Không có ký tự hợp lệ</h3>
        <p className="text-sm text-stone-500 mt-2 max-w-sm">
          Vui lòng cuộn xuống bên dưới để tích chọn tối thiểu một hàng ký tự {characterSet === "hiragana" ? "Hiragana" : "Katakana"} để bắt đầu luyện tập!
        </p>
      </div>
    );
  }

  // Get Stroke Guide for current character
  const strokeGuide = currentChar?.hiragana ? (STROKE_GUIDES[currentChar.hiragana] || {
    strokes: 3,
    sequence: ["Nét 1: Bắt đầu nét viết phần trên", "Nét 2: Phác thảo nét trung tâm dọc", "Nét 3: Hoàn thành cấu trúc khép hờ"]
  }) : {
    strokes: 3,
    sequence: ["Nét 1: Bắt đầu vẽ", "Nét 2: Giai đoạn phác họa dọc", "Nét 3: Hoàn thành"]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch">
      {/* Left Column: Interactive Flip Card */}
      <div className="lg:col-span-7 flex flex-col items-center">
        {/* Helper instructions */}
        <div className="text-stone-400 text-xs mb-3 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Mẹo: Nhấn Space để lật thẻ, phím ←/→ để đổi chữ</span>
        </div>

        {/* 3D Card Containment */}
        <div className="w-full relative h-[320px] sm:h-96 [perspective:1000px] cursor-pointer" onClick={handleFlip}>
          <AnimatePresence mode="wait">
            <motion.div
              id={`flashcard-item-${currentChar.romaji}`}
              key={currentChar.hiragana + (isFlipped ? "-back" : "-front")}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl border p-4 sm:p-8 flex flex-col justify-between shadow-xs select-none backface-hidden ${
                isFlipped
                  ? "bg-stone-900 border-stone-800 text-stone-200"
                  : "bg-white border-stone-200 text-stone-850"
              }`}
            >
              {/* Card Header: Type indicator */}
              <div className="w-full flex justify-between items-center text-[10px] font-extrabold tracking-wider uppercase opacity-65">
                <span>THẺ KÍ TỰ {characterSet.toUpperCase()}</span>
                <span>{isFlipped ? "MẶT SAU: PHIÊN ÂM & NGHĨA" : "MẶT TRƯỚC: MẶT CHỮ"}</span>
              </div>

              {/* Card Center: Main big symbol details */}
              {!isFlipped ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                  <span className="font-serif-jp text-stone-850 text-7xl sm:text-9xl font-black block select-none">
                    {currentChar.hiragana}
                  </span>
                  <span className="text-xs text-stone-400">Nhấp để xem phiên âm la-tinh</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Phiên âm Romaji</span>
                    <span className="font-sans font-black text-rose-500 text-5xl sm:text-6xl block select-all tracking-tight">
                      {currentChar.romaji}
                    </span>
                  </div>

                  <div className="h-[1px] w-24 bg-stone-800/80"></div>

                  <div className="text-center space-y-2 max-w-sm px-4">
                    <div className="text-xs">
                      <span className="text-stone-400 block mb-0.5">Cách phát âm (tiếng Việt)</span>
                      <strong className="text-emerald-400 text-sm">
                        phát âm giống &ldquo;{currentChar.vietnamesePronunciation}&rdquo;
                      </strong>
                    </div>

                    {currentChar.mnemonic && (
                      <div className="bg-stone-950 border border-stone-850/65 rounded-xl p-3 mt-2">
                        <span className="text-[9px] text-stone-500 block uppercase font-bold mb-1">Mẹo ghi nhớ</span>
                        <p className="text-xs text-stone-300 leading-relaxed italic">
                          &ldquo;{currentChar.mnemonic}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Footer: controls */}
              <div className="w-full flex items-center justify-between mt-2 pt-4 border-t border-stone-150">
                <button
                  id="btn-speak-character"
                  onClick={handleAudio}
                  className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Phát âm
                </button>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-stone-400 text-xs cursor-pointer select-none">
                    <input
                      id="checkbox-audio-auto"
                      type="checkbox"
                      checked={autoSpeak}
                      onChange={(e) => {
                        sounds.playClick();
                        setAutoSpeak(e.target.checked);
                      }}
                      className="rounded-sm border-stone-300 text-rose-500 focus:ring-rose-400"
                    />
                    <span>Tự nói khi đổi</span>
                  </label>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            id="btn-flashcard-prev"
            onClick={handlePrev}
            className="w-11 h-11 border border-stone-200 hover:border-stone-300 bg-white text-stone-600 hover:text-stone-850 rounded-xl flex items-center justify-center transition-all hover:-translate-x-0.5"
            title="Ký tự trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            id="btn-flashcard-randomize"
            onClick={handleRandomize}
            className="px-5 py-2.5 font-medium text-xs bg-stone-900 hover:bg-stone-850 text-white rounded-xl transition-all shadow-xs hover:scale-105"
          >
            🔀 Ngẫu nhiên hóa bản ghi
          </button>

          <button
            id="btn-flashcard-next"
            onClick={handleNext}
            className="w-11 h-11 border border-stone-200 hover:border-stone-300 bg-white text-stone-600 hover:text-stone-850 rounded-xl flex items-center justify-center transition-all hover:translate-x-0.5"
            title="Ký tự tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Column: Sketchpad Practice Writing Board with Stroke Guides */}
      <div className="lg:col-span-5 flex flex-col justify-between bg-stone-900 text-stone-250 p-6 rounded-2xl border border-stone-850 shadow-md">
        <div>
          <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-stone-800">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-white">Khung Tập Viết Chữ</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Tô theo nét đứt mờ để ghi nhớ đúng form</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[10px] text-stone-400 font-mono font-medium">BÚT VẼ</span>
            </div>
          </div>

          {/* Draw Pad Canvas */}
          <div className="relative w-full aspect-square bg-stone-950 border border-stone-800 rounded-xl overflow-hidden cursor-crosshair">
            {/* Visual stroke helper grid */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full text-stone-850/40" viewBox="0 0 100 100">
                <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="2" fill="currentColor" />
              </svg>
            </div>

            {/* Faint reference character for tracing */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
              <span className="font-serif-jp text-stone-850 text-8xl font-bold opacity-30 select-none">
                {currentChar?.hiragana}
              </span>
            </div>

            <canvas
              id="writing-canvas-practice"
              ref={canvasRef}
              width={280}
              height={280}
              className="absolute inset-0 w-full h-full block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* New Stroke Order Helper Panel */}
          <div className="mt-4 p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-stone-850 pb-1.5">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                ✍️ Thứ tự nét viết ({strokeGuide.strokes} nét)
              </span>
              <span className="text-[9px] bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded text-stone-400 font-mono font-bold uppercase">
                HIRAGANA
              </span>
            </div>
            <ol className="space-y-1.5 text-[11px] text-stone-300 leading-normal list-decimal pl-4 font-sans">
              {strokeGuide.sequence.map((step, sIdx) => {
                // Ensure nice display
                const stepClean = step.includes(":") ? step.split(":")[1].trim() : step;
                return (
                  <li id={`stroke-step-${sIdx}`} key={sIdx} className="pl-0.5">
                    {stepClean}
                  </li>
                );
              })}
            </ol>
          </div>

        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            id="btn-clear-writing-pad"
            onClick={() => {
              sounds.playClick();
              clearCanvas();
            }}
            className="flex-1 py-2 text-xs font-semibold text-stone-300 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa nét vẽ
          </button>

          <button
            id="btn-speak-writing-pad"
            onClick={() => sounds.playSuccess()}
            className="px-4 py-2 text-xs font-semibold text-stone-400 bg-stone-850 hover:bg-stone-800 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Đánh giá nhanh"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
}
