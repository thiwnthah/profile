const rotateOverlay = document.getElementById("rotate-overlay");

let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// UI elements
const sceneContainer = document.getElementById("scene-container");
const chatText = document.getElementById("chat-text");
const narratorName = document.getElementById("narrator-name");
const pathMessageBox = document.getElementById("path-message-box");
const pathMessageText = document.getElementById("path-message-text");
const pathNarratorName = document.getElementById("path-narrator-name");
const continueBtn = document.getElementById("continue-btn");
const backBtn = document.getElementById("back-btn");
const finalSurprise = document.getElementById("final-surprise");
const yesBtn = document.getElementById("yes-btn");
const thinkBtn = document.getElementById("think-btn");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const upBtn = document.getElementById("up-btn");
const downBtn = document.getElementById("down-btn");

let playerChoices = [];
let isGameActive = true;
let currentScene = 0;
let knightX = canvas.width / 2;
let knightY = canvas.height / 2;
let knightSpeed = 1;
let isMovingLeft = false;
let isMovingRight = false;
let isMovingUp = false;
let isMovingDown = false;
let knightFrame = 0;
let frameCount = 0;
let lastMessageTime = 0;
let messageInterval = 5000;
let isMessageBoxOpen = false;
let lastWallHitTime = 0;
let wallHitCooldown = 3000;
let justEnteredScene = false;
let collisionCooldown = 0;
let lastCollisionTime = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Điều chỉnh lại vị trí nhân vật để nằm giữa màn hình sau khi xoay
  knightX = canvas.width / 2;
  knightY = canvas.height / 2;

  // Cập nhật lại bounds của các con đường (nếu cần)
  scenes.forEach((scene) => {
    if (scene.pathBounds.vertical) {
      scene.pathBounds.vertical.xMin = canvas.width / 2 - 50;
      scene.pathBounds.vertical.xMax = canvas.width / 2 + 50;
      scene.pathBounds.vertical.yMin = 0;
      scene.pathBounds.vertical.yMax = canvas.height;
    }
    if (scene.pathBounds.horizontal) {
      scene.pathBounds.horizontal.xMin = 0;
      scene.pathBounds.horizontal.xMax = canvas.width;
      scene.pathBounds.horizontal.yMin = canvas.height / 2 - 50;
      scene.pathBounds.horizontal.yMax = canvas.height / 2 + 50;
    }
    if (scene.pathBounds.diagonal1) {
      scene.pathBounds.diagonal1.x1 = canvas.width * 0.2;
      scene.pathBounds.diagonal1.y1 = canvas.height * 0.2;
      scene.pathBounds.diagonal1.x2 = canvas.width * 0.8;
      scene.pathBounds.diagonal1.y2 = canvas.height * 0.8;
    }
    if (scene.pathBounds.diagonal2) {
      scene.pathBounds.diagonal2.x1 = canvas.width * 0.8;
      scene.pathBounds.diagonal2.y1 = canvas.height * 0.2;
      scene.pathBounds.diagonal2.x2 = canvas.width * 0.2;
      scene.pathBounds.diagonal2.y2 = canvas.height * 0.8;
    }
  });
}

function checkOrientationAndDevice() {
  const isPortrait = window.innerHeight > window.innerWidth;

  if (!isMobile) {
    // PC: tốc độ mặc định
    knightSpeed = 1;
    rotateOverlay.classList.add("hidden");
    isGameActive = true;
    resizeCanvas();
  } else if (isPortrait) {
    // Mobile portrait: dừng game
    rotateOverlay.classList.remove("hidden");
    isGameActive = false;
  } else {
    // Mobile landscape: giảm tốc độ hơn nữa
    knightSpeed = 0.5; // Tốc độ chậm hơn trên mobile
    rotateOverlay.classList.add("hidden");
    if (!isGameActive) {
      isGameActive = true;
      resizeCanvas();
      animate();
    }
  }
}

// Gọi khi load và khi thay đổi kích thước/orientation
window.addEventListener("load", () => {
  resizeCanvas();
  checkOrientationAndDevice();
});
window.addEventListener("resize", () => {
  resizeCanvas();
  checkOrientationAndDevice();
});
window.addEventListener("orientationchange", () => {
  resizeCanvas();
  checkOrientationAndDevice();
});

// Load ảnh tĩnh cho nhân vật nữ
const femaleBackFrames = [new Image(), new Image(), new Image()];
femaleBackFrames[0].src = "Walk/Up Walk/01.png";
femaleBackFrames[1].src = "Walk/Up Walk/02.png";
femaleBackFrames[2].src = "Walk/Up Walk/03.png";

const femaleFrontFrames = [new Image(), new Image(), new Image()];
femaleFrontFrames[0].src = "Walk/Down Walk/01.png";
femaleFrontFrames[1].src = "Walk/Down Walk/02.png";
femaleFrontFrames[2].src = "Walk/Down Walk/03.png";

const femaleLeftFrames = [new Image(), new Image()];
femaleLeftFrames[0].src = "Walk/Left Walk/01.png";
femaleLeftFrames[1].src = "Walk/Left Walk/02.png";

const femaleRightFrames = [new Image(), new Image()];
femaleRightFrames[0].src = "Walk/Right Walk/01.png";
femaleRightFrames[1].src = "Walk/Right Walk/02.png";

let currentFemaleImg = femaleFrontFrames[0];

// Load hình nền
const backgroundImages = [new Image(), new Image(), new Image()];
backgroundImages[0].src = "1.webp";
backgroundImages[1].src = "2.webp";
backgroundImages[2].src = "3.webp";

// Biến để kiểm tra tải hình ảnh
let imagesLoaded = 0;
const totalImages =
  femaleBackFrames.length +
  femaleFrontFrames.length +
  femaleLeftFrames.length +
  femaleRightFrames.length +
  backgroundImages.length;

function checkAllImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    updateScene(); // Khởi tạo cảnh
    animate(); // Bắt đầu animation
  }
}

function startMoving(direction) {
  if (direction === "up") isMovingUp = true;
  if (direction === "down") isMovingDown = true;
  if (direction === "left") isMovingLeft = true;
  if (direction === "right") isMovingRight = true;
}

// Hàm xử lý dừng di chuyển
function stopMoving(direction) {
  if (direction === "up") isMovingUp = false;
  if (direction === "down") isMovingDown = false;
  if (direction === "left") isMovingLeft = false;
  if (direction === "right") isMovingRight = false;
}

// Gắn sự kiện cho cả chuột và cảm ứng
function addControlEvents(btn, direction) {
  // Sự kiện chuột
  btn.addEventListener("mousedown", () => startMoving(direction));
  btn.addEventListener("mouseup", () => stopMoving(direction));
  btn.addEventListener("mouseleave", () => stopMoving(direction)); // Dừng khi chuột rời nút

  // Sự kiện cảm ứng
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Ngăn scroll hoặc hành vi mặc định
    startMoving(direction);
  });
  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    stopMoving(direction);
  });
  btn.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    stopMoving(direction);
  });
}

// Áp dụng cho từng nút
addControlEvents(upBtn, "up");
addControlEvents(downBtn, "down");
addControlEvents(leftBtn, "left");
addControlEvents(rightBtn, "right");

// Gắn sự kiện onload cho tất cả hình ảnh
femaleBackFrames.forEach((img) => (img.onload = checkAllImagesLoaded));
femaleFrontFrames.forEach((img) => (img.onload = checkAllImagesLoaded));
femaleLeftFrames.forEach((img) => (img.onload = checkAllImagesLoaded));
femaleRightFrames.forEach((img) => (img.onload = checkAllImagesLoaded));
backgroundImages.forEach((img) => (img.onload = checkAllImagesLoaded));

// Xử lý lỗi tải hình ảnh
femaleBackFrames.forEach(
  (img) => (img.onerror = () => console.error(`Failed to load ${img.src}`))
);
femaleFrontFrames.forEach(
  (img) => (img.onerror = () => console.error(`Failed to load ${img.src}`))
);
femaleLeftFrames.forEach(
  (img) => (img.onerror = () => console.error(`Failed to load ${img.src}`))
);
femaleRightFrames.forEach(
  (img) => (img.onerror = () => console.error(`Failed to load ${img.src}`))
);
backgroundImages.forEach(
  (img) => (img.onerror = () => console.error(`Failed to load ${img.src}`))
);

// Dữ liệu các khu vực
const scenes = [
  {
    narrator: "Phú Tài",
    pathUp: "Ký ức vui vẻ",
    pathDown: "Cảm xúc bùng nổ",
    pathLeft: "Kế hoạch tương lai",
    pathRight: "Niềm tin bất biến",
    pathUpMessage:
      "Ồ, mình lạc vào đường Ký ức vui vẻ rồi! Nhớ lần đầu gặp em không? Anh cứ đứng ngẩn ra vì nụ cười của em, giờ nghĩ lại vẫn thấy buồn cười. Em thì sao, có ấn tượng gì không?",
    pathDownMessage:
      "Đây là đường Cảm xúc bùng nổ nè! Anh không đùa đâu, mỗi lần gần em là tim anh đập thình thịch, kiểu không kiểm soát nổi luôn. Em có bao giờ thấy thế không hay chỉ anh bị vậy thôi?",
    pathLeftMessage:
      "Đường Kế hoạch tương lai đây! Anh hay tưởng tượng sau này mình cùng nhau đi du lịch, ăn uống khắp nơi. Em thấy thế nào, có muốn lên kế hoạch với anh không?",
    pathRightMessage:
      "Đường Niềm tin bất biến đây rồi! Anh tin là dù có chuyện gì, mình vẫn sẽ vượt qua được, miễn là có em bên cạnh. Em cũng tin anh chứ? Đừng làm anh hồi hộp nha!",
    randomMessages: [
      "Em thấy khu rừng này thế nào? Đẹp thật, mà anh thấy em đứng đây còn làm nó lung linh hơn.",
      "Anh cá em sẽ chọn đường bất ngờ nhất, kiểu gì cũng làm anh đoán hụt!",
      "Nghe tiếng chim kìa, chắc chúng đang cổ vũ tụi mình đấy!",
      "Đi với em thế này chill thật, em có thấy thoải mái không?",
      "Này, em đi chậm thôi, anh còn muốn ngắm cảnh với em thêm chút nữa mà!",
    ],
    pathBounds: {
      vertical: {
        xMin: canvas.width / 2 - 50,
        xMax: canvas.width / 2 + 50,
        yMin: 0,
        yMax: canvas.height,
      },
      horizontal: {
        xMin: 0,
        xMax: canvas.width,
        yMin: canvas.height / 2 - 50,
        yMax: canvas.height / 2 + 50,
      },
    },
  },
  {
    narrator: "Phú Tài",
    pathUpLeft: "Sự dễ thương của em",
    pathUpRight: "Niềm vui mỗi ngày",
    pathDownLeft: "Cùng nhau chill",
    pathDownRight: "Kỷ niệm đáng nhớ",
    pathUpLeftMessage:
      "Đường Sự dễ thương của em đây rồi! Em không biết đâu, mấy lúc em vô tư cười đùa là anh chỉ muốn hét lên ‘Trời ơi dễ thương quá!’ đấy. Có ai nói với em vậy chưa?",
    pathUpRightMessage:
      "Niềm vui mỗi ngày đây nè! Ở cạnh em là anh tự nhiên thấy vui, kiểu không cần lý do gì luôn. Em có thấy anh hài hước hơn khi có em không?",
    pathDownLeftMessage:
      "Đường Cùng nhau chill! Anh thích nhất là những lúc hai đứa ngồi nói chuyện linh tinh, thoải mái lắm. Em có muốn thêm nhiều ngày như thế với anh không?",
    pathDownRightMessage:
      "Kỷ niệm đáng nhớ đây rồi! Nhớ lần đầu em kéo tay anh chạy mưa không? Lúc đó ướt nhẹp mà anh vẫn thấy vui, giờ nghĩ lại vẫn cười. Em thì sao?",
    randomMessages: [
      "Khu vườn này đẹp ghê, mà anh thấy em đứng cạnh hoa là hoa phải ganh tị luôn!",
      "Nhìn ánh nắng lọt qua cây kìa, làm anh nhớ lần em làm mặt ngố chụp ảnh.",
      "Chọn đường nào đây em? Anh thì chỉ muốn đi mãi với em thôi!",
      "Đi với em thế này, tự nhiên anh thấy đời nhẹ nhàng hẳn. Em có thấy vậy không?",
      "Này, dừng lại chụp cái ảnh đi, anh muốn giữ lại khoảnh khắc này với em!",
    ],
    pathBounds: {
      diagonal1: {
        x1: canvas.width * 0.2,
        y1: canvas.height * 0.2,
        x2: canvas.width * 0.8,
        y2: canvas.height * 0.8,
      },
      diagonal2: {
        x1: canvas.width * 0.8,
        y1: canvas.height * 0.2,
        x2: canvas.width * 0.2,
        y2: canvas.height * 0.8,
      },
    },
  },
  {
    narrator: "Phú Tài",
    pathUp: "Lời hứa đơn giản",
    pathDown: "Tình cảm thật lòng",
    pathLeft: "Bên này không đi được!",
    pathRight: "Chỉ có tiến lên thôi",
    pathUpMessage:
      "Đường Lời hứa đơn giản đây! Anh không giỏi nói lời bay bổng, nhưng anh hứa sẽ luôn thật lòng với em. Em thấy anh đáng tin không?",
    pathDownMessage:
      "Tình cảm thật lòng đây rồi! Anh thích em thật, không đùa đâu, dù có lúc anh ngại nói ra. Em có đoán được không hay anh phải nói to hơn?",
    pathLeftMessage:
      "Ờ, bên này không đi được đâu! Chắc tụi mình phải tìm đường khác thôi, em chọn đi, anh theo!",
    pathRightMessage:
      "Chỉ có tiến lên thôi! Anh nghĩ thích em là chuyện nghiêm túc, nên anh sẽ không lùi bước. Em có muốn đi cùng anh không?",
    randomMessages: [
      "Khu vườn này lãng mạn ghê, mà anh thấy ngồi đây nói chuyện với em còn thú vị hơn.",
      "Nhìn hoa hồng kìa, đỏ rực như mặt anh lúc đứng gần em vậy!",
      "Em chọn đường nào cũng được, miễn là đừng bỏ anh lại nha!",
      "Đi với em thế này vui thật, em có thích không hay chỉ anh tự tưởng tượng?",
      "Dừng chút đi em, anh muốn ngắm em thêm tí, cảnh đẹp quá mà!",
    ],
    pathBounds: {
      vertical: {
        xMin: canvas.width / 2 - 50,
        xMax: canvas.width / 2 + 50,
        yMin: 0,
        yMax: canvas.height,
      },
      horizontal: {
        xMin: 0,
        xMax: canvas.width,
        yMin: canvas.height / 2 + 50,
        yMax: canvas.height / 2 + 150,
      },
    },
  },
];

// Biến khóa để kiểm soát việc gõ
let isTyping = false;

// Hiển thị tin nhắn ở góc trái với hiệu ứng gõ từ từ
function showChatMessage(text) {
  if (isTyping) return; // Nếu đang gõ, bỏ qua tin nhắn mới

  isTyping = true; // Khóa lại
  chatText.textContent = ""; // Xóa nội dung cũ
  chatText.classList.add("visible");
  let i = 0;
  const speed = 50; // Tốc độ gõ (ms mỗi ký tự)

  function type() {
    if (i < text.length) {
      chatText.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Sau khi gõ xong, chờ 3 giây rồi ẩn
      setTimeout(() => {
        chatText.classList.remove("visible");
        isTyping = false; // Mở khóa sau khi hoàn tất
      }, 1000);
    }
  }

  type(); // Bắt đầu gõ
}
// Vẽ cảnh
function drawScene() {
  if (!isGameActive) return; // Dừng vẽ nếu game không active

  if (backgroundImages[currentScene].complete) {
    ctx.drawImage(
      backgroundImages[currentScene],
      0,
      0,
      canvas.width,
      canvas.height
    );
  } else {
    ctx.fillStyle = "#1a2d1e"; // Màu nền tạm nếu ảnh chưa tải
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(
    backgroundImages[currentScene],
    0,
    0,
    canvas.width,
    canvas.height
  );
  if (currentFemaleImg && currentFemaleImg.complete) {
    ctx.drawImage(currentFemaleImg, knightX - 32, knightY - 32, 64, 64);
  }
  ctx.fillStyle = "#fff";
  ctx.font = '24px "Dancing Script"';
  ctx.textAlign = "center";
  if (currentScene === 1) {
    ctx.fillText(
      scenes[currentScene].pathUpLeft,
      canvas.width * 0.2,
      canvas.height * 0.2
    );
    ctx.fillText(
      scenes[currentScene].pathUpRight,
      canvas.width * 0.8,
      canvas.height * 0.2
    );
    ctx.fillText(
      scenes[currentScene].pathDownLeft,
      canvas.width * 0.2,
      canvas.height * 0.8
    );
    ctx.fillText(
      scenes[currentScene].pathDownRight,
      canvas.width * 0.8,
      canvas.height * 0.8
    );
  } else if (currentScene === 2) {
    ctx.fillText(
      scenes[currentScene].pathUp,
      canvas.width * 0.5,
      canvas.height * 0.1 - 30
    );
    ctx.fillText(
      scenes[currentScene].pathDown,
      canvas.width * 0.5,
      canvas.height * 0.9 + 50
    );
    ctx.fillText(
      scenes[currentScene].pathLeft,
      canvas.width * 0.1,
      canvas.height * 0.5 + 70
    );
    ctx.fillText(
      scenes[currentScene].pathRight,
      canvas.width * 0.9,
      canvas.height * 0.5 + 70
    );
  } else {
    ctx.fillText(
      scenes[currentScene].pathUp,
      canvas.width * 0.5,
      canvas.height * 0.1 - 30
    );
    ctx.fillText(
      scenes[currentScene].pathDown,
      canvas.width * 0.5,
      canvas.height * 0.9 + 50
    );
    ctx.fillText(
      scenes[currentScene].pathLeft,
      canvas.width * 0.1,
      canvas.height * 0.5 - 30
    );
    ctx.fillText(
      scenes[currentScene].pathRight,
      canvas.width * 0.9,
      canvas.height * 0.5 - 30
    );
  }

  let newKnightX = knightX;
  let newKnightY = knightY;

  if (isMovingLeft) newKnightX -= knightSpeed;
  if (isMovingRight) newKnightX += knightSpeed;
  if (isMovingUp) newKnightY -= knightSpeed;
  if (isMovingDown) newKnightY += knightSpeed;

  let canMove = false;
  if (currentScene === 1) {
    const { diagonal1, diagonal2 } = scenes[currentScene].pathBounds;
    const slope1 =
      (diagonal1.y2 - diagonal1.y1) / (diagonal1.x2 - diagonal1.x1);
    const yOnDiagonal1 = slope1 * (newKnightX - diagonal1.x1) + diagonal1.y1;
    const distanceToDiagonal1 = Math.abs(newKnightY - yOnDiagonal1);
    const slope2 =
      (diagonal2.y2 - diagonal2.y1) / (diagonal2.x2 - diagonal2.x1);
    const yOnDiagonal2 = slope2 * (newKnightX - diagonal2.x1) + diagonal2.y1;
    const distanceToDiagonal2 = Math.abs(newKnightY - yOnDiagonal2);

    if (
      (distanceToDiagonal1 <= 100 &&
        newKnightX >= diagonal1.x1 - 50 &&
        newKnightX <= diagonal1.x2 + 50) ||
      (distanceToDiagonal2 <= 100 &&
        newKnightX >= diagonal2.x2 - 50 &&
        newKnightX <= diagonal2.x1 + 50)
    ) {
      canMove = true;
    }
  } else {
    const { vertical, horizontal } = scenes[currentScene].pathBounds;
    if (
      (newKnightX >= vertical.xMin && newKnightX <= vertical.xMax) ||
      (newKnightY >= horizontal.yMin && newKnightY <= horizontal.yMax)
    ) {
      canMove = true;
    }
  }

  if (canMove) {
    knightX = Math.max(0, Math.min(newKnightX, canvas.width - 64));
    knightY = Math.max(0, Math.min(newKnightY, canvas.height - 64));
    const currentTime = Date.now();
    if (
      knightX <= 0 ||
      knightX >= canvas.width - 64 ||
      knightY <= 0 ||
      knightY >= canvas.height - 64
    ) {
      if (currentTime - lastWallHitTime >= wallHitCooldown) {
        showChatMessage("Đi đứng cẩn thận vào!");
        lastWallHitTime = currentTime;
      }
    }
  }

  // Cập nhật frame animation
  frameCount++;
  if (frameCount % 10 === 0) {
    if (isMovingUp || isMovingDown) {
      knightFrame = (knightFrame + 1) % 3;
    } else if (isMovingLeft || isMovingRight) {
      knightFrame = (knightFrame + 1) % 2;
    } else {
      knightFrame = 0;
    }
  }

  // Chọn hình ảnh dựa trên hướng di chuyển với kiểm tra hợp lệ
  if (isMovingUp) {
    currentFemaleImg =
      femaleBackFrames[knightFrame] && femaleBackFrames[knightFrame].complete
        ? femaleBackFrames[knightFrame]
        : femaleFrontFrames[0];
  } else if (isMovingDown) {
    currentFemaleImg =
      femaleFrontFrames[knightFrame] && femaleFrontFrames[knightFrame].complete
        ? femaleFrontFrames[knightFrame]
        : femaleFrontFrames[0];
  } else if (isMovingLeft) {
    currentFemaleImg =
      femaleLeftFrames[knightFrame] && femaleLeftFrames[knightFrame].complete
        ? femaleLeftFrames[knightFrame]
        : femaleFrontFrames[0];
  } else if (isMovingRight) {
    currentFemaleImg =
      femaleRightFrames[knightFrame] && femaleRightFrames[knightFrame].complete
        ? femaleRightFrames[knightFrame]
        : femaleFrontFrames[0];
  } else {
    currentFemaleImg = femaleFrontFrames[0];
  }

  // Vẽ nhân vật với kích thước lớn hơn (48x48 -> 64x64 trên canvas)
  ctx.drawImage(currentFemaleImg, knightX - 32, knightY - 32, 64, 64);

  if (
    !isMessageBoxOpen &&
    !justEnteredScene &&
    Date.now() - lastCollisionTime >= collisionCooldown
  ) {
    checkCollisions();
  }

  if (!isMessageBoxOpen) {
    const currentTime = Date.now();
    if (currentTime - lastMessageTime >= messageInterval) {
      const randomMessage =
        scenes[currentScene].randomMessages[
          Math.floor(Math.random() * scenes[currentScene].randomMessages.length)
        ];
      showChatMessage(randomMessage);
      lastMessageTime = currentTime;
    }
  }

  if (justEnteredScene && Date.now() - lastMessageTime >= 1000) {
    justEnteredScene = false;
  }
}

// Kiểm tra va chạm (giữ nguyên)
function checkCollisions() {
  if (currentScene === 1) {
    if (
      Math.abs(knightX - canvas.width * 0.2) < 40 &&
      Math.abs(knightY - canvas.height * 0.2) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathUpLeftMessage,
        scenes[currentScene].narrator
      );
    }
    if (
      Math.abs(knightX - canvas.width * 0.8) < 40 &&
      Math.abs(knightY - canvas.height * 0.2) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathUpRightMessage,
        scenes[currentScene].narrator
      );
    }
    if (
      Math.abs(knightX - canvas.width * 0.2) < 40 &&
      Math.abs(knightY - canvas.height * 0.8) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathDownLeftMessage,
        scenes[currentScene].narrator
      );
    }
    if (
      Math.abs(knightX - canvas.width * 0.8) < 40 &&
      Math.abs(knightY - canvas.height * 0.8) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathDownRightMessage,
        scenes[currentScene].narrator
      );
    }
  } else {
    if (
      Math.abs(knightX - canvas.width * 0.5) < 40 &&
      Math.abs(knightY - canvas.height * 0.1) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathUpMessage,
        scenes[currentScene].narrator
      );
    }
    if (
      Math.abs(knightX - canvas.width * 0.5) < 40 &&
      Math.abs(knightY - canvas.height * 0.9) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathDownMessage,
        scenes[currentScene].narrator
      );
    }
    if (
      Math.abs(knightX - canvas.width * 0.1) < 40 &&
      Math.abs(knightY - canvas.height * 0.5) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathLeftMessage,
        scenes[currentScene].narrator
      );
    }
    if (
      Math.abs(knightX - canvas.width * 0.9) < 40 &&
      Math.abs(knightY - canvas.height * 0.5) < 40
    ) {
      showPathMessage(
        scenes[currentScene].pathRightMessage,
        scenes[currentScene].narrator
      );
    }
  }
}

// Animation loop
function animate() {
  if (!isGameActive) return; // Dừn  animation nếu game không active
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawScene();
  requestAnimationFrame(animate);
}
animate();

// Điều khiển bằng nút trên màn hình (giữ nguyên)
leftBtn.addEventListener("mousedown", () => {
  if (!isMessageBoxOpen) isMovingLeft = true;
});
leftBtn.addEventListener("mouseup", () => {
  isMovingLeft = false;
});
rightBtn.addEventListener("mousedown", () => {
  if (!isMessageBoxOpen) isMovingRight = true;
});
rightBtn.addEventListener("mouseup", () => {
  isMovingRight = false;
});
upBtn.addEventListener("mousedown", () => {
  if (!isMessageBoxOpen) isMovingUp = true;
});
upBtn.addEventListener("mouseup", () => {
  isMovingUp = false;
});
downBtn.addEventListener("mousedown", () => {
  if (!isMessageBoxOpen) isMovingDown = true;
});
downBtn.addEventListener("mouseup", () => {
  isMovingDown = false;
});

// Điều khiển bằng bàn phím (giữ nguyên)
document.addEventListener("keydown", (event) => {
  if (!isMessageBoxOpen) {
    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        isMovingLeft = true;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        isMovingRight = true;
        break;
      case "ArrowUp":
      case "w":
      case "W":
        isMovingUp = true;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        isMovingDown = true;
        break;
    }
  }
});
document.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "ArrowLeft":
    case "a":
    case "A":
      isMovingLeft = false;
      break;
    case "ArrowRight":
    case "d":
    case "D":
      isMovingRight = false;
      break;
    case "ArrowUp":
    case "w":
    case "W":
      isMovingUp = false;
      break;
    case "ArrowDown":
    case "s":
    case "S":
      isMovingDown = false;
      break;
  }
});

// Hiển thị thông báo khi vào con đường (giữ nguyên)
function showPathMessage(text, narrator) {
  if (!isMessageBoxOpen) {
    pathMessageText.textContent = text;
    pathNarratorName.textContent = narrator;
    pathMessageBox.classList.remove("hidden");
    isMessageBoxOpen = true;
    isMovingLeft = false;
    isMovingRight = false;
    isMovingUp = false;
    isMovingDown = false;
    lastCollisionTime = Date.now();

    // Lưu lựa chọn dựa trên con đường
    const scene = scenes[currentScene];
    if (text === scene.pathUpMessage) playerChoices.push(scene.pathUp);
    else if (text === scene.pathDownMessage) playerChoices.push(scene.pathDown);
    else if (text === scene.pathLeftMessage) playerChoices.push(scene.pathLeft);
    else if (text === scene.pathRightMessage)
      playerChoices.push(scene.pathRight);
    else if (text === scene.pathUpLeftMessage)
      playerChoices.push(scene.pathUpLeft);
    else if (text === scene.pathUpRightMessage)
      playerChoices.push(scene.pathUpRight);
    else if (text === scene.pathDownLeftMessage)
      playerChoices.push(scene.pathDownLeft);
    else if (text === scene.pathDownRightMessage)
      playerChoices.push(scene.pathDownRight);
  }
}
// Hàm tạo đoạn văn tổng kết "đỉnh cao"
function generateFinalMessage() {
  if (playerChoices.length === 0) {
    return "Ừm, hành trình của chúng ta ngắn như một cú chớp mắt, nhưng anh vẫn kịp nhận ra: thích em là chuyện không cần lý do! Em cho anh cơ hội làm lại từ đầu không nhé?";
  }

  let message =
    "Wow, em ơi, hành trình vừa rồi đúng là một chuyến phiêu lưu tuyệt vời! ";

  // Dựa trên số lượng lựa chọn
  if (playerChoices.length === 1) {
    message += `Chỉ với "${playerChoices[0]}", anh đã thấy tim mình rung rinh như trúng số độc đắc. `;
    if (
      playerChoices[0].includes("Ký ức") ||
      playerChoices[0].includes("Kỷ niệm")
    ) {
      message +=
        "Những giây phút ấy cứ như phim chiếu chậm trong đầu anh vậy. ";
    } else if (
      playerChoices[0].includes("Tình cảm") ||
      playerChoices[0].includes("Niềm tin")
    ) {
      message += "Em làm anh tin rằng tình yêu thật sự có thật đấy! ";
    }
  } else if (playerChoices.length === 2) {
    message += `Từ "${playerChoices[0]}" đến "${playerChoices[1]}", mỗi bước đi cùng em là một lần anh tự nhéo mình xem có mơ không. `;
    if (
      playerChoices.includes("Sự dễ thương") ||
      playerChoices.includes("Niềm vui")
    ) {
      message += "Cười với em mà anh quên luôn cả giờ giấc luôn rồi! ";
    } else if (
      playerChoices.includes("Cảm xúc") ||
      playerChoices.includes("Tình cảm")
    ) {
      message += "Tim anh đập loạn xạ, chắc phải nhờ em giữ hộ mất thôi. ";
    }
  } else {
    message += `Từ "${playerChoices[0]}" qua "${playerChoices[1]}" rồi đến "${playerChoices[2]}", anh chỉ muốn hét lên: ‘Trời ơi, sao em tuyệt thế này!’ `;
    if (
      playerChoices.includes("Kế hoạch") ||
      playerChoices.includes("Lời hứa")
    ) {
      message += "Anh đã tưởng tượng cả một tương lai rực rỡ bên em rồi đấy. ";
    } else if (
      playerChoices.includes("Chill") ||
      playerChoices.includes("Kỷ niệm")
    ) {
      message += "Những khoảnh khắc bên em đúng là báu vật anh muốn giữ mãi. ";
    }
    message += "Em chính là ‘mảnh ghép vàng’ anh tìm kiếm bấy lâu! ";
  }

  // Kết thúc hoành tráng
  message +=
    "Vậy giờ tính sao đây, em? Đồng ý làm ‘đồng đội’ của anh để cùng viết tiếp câu chuyện tình siêu đỉnh này không? Anh hồi hộp chờ câu trả lời của em lắm đấy!";

  return message;
}
// Nút "Tiếp tục" (giữ nguyên)
continueBtn.addEventListener("click", () => {
  console.log("Continue clicked, currentScene:", currentScene);
  pathMessageBox.classList.add("hidden");
  isMessageBoxOpen = false;
  sceneContainer.style.transition = "opacity 1s ease";
  sceneContainer.style.opacity = 0;
  setTimeout(() => {
    currentScene++;
    console.log("New currentScene:", currentScene);
    if (currentScene < scenes.length) {
      updateScene();
      sceneContainer.style.opacity = 1;
      if (currentScene === 1) {
        knightX = canvas.width / 2;
        knightY = canvas.height / 2 + 50;
      } else if (currentScene === 2) {
        knightX = canvas.width / 2;
        knightY = canvas.height / 2 + 100;
      } else {
        knightX = canvas.width / 2;
        knightY = canvas.height / 2;
      }
      justEnteredScene = true;
      collisionCooldown = 0;
      lastCollisionTime = Date.now();
    } else {
      console.log("Switching to final surprise");
      pathMessageText.textContent =
        "Chúc mừng em! Chúng ta đã đi qua mọi con đường tình yêu. Bây giờ, hãy chuẩn bị cho điều bất ngờ cuối cùng nhé!";
      pathNarratorName.textContent = "Hiệp Sĩ Lãng Mạn";
      pathMessageBox.classList.remove("hidden");
      isMessageBoxOpen = true;
      setTimeout(() => {
        console.log("Calling showFinalSurpriseOnly");
        pathMessageBox.classList.add("hidden");
        isMessageBoxOpen = false;
        isGameActive = false;
        showFinalSurpriseOnly(); // Gọi đúng hàm
      }, 3000);
    }
  }, 1000);
});
// Cập nhật hàm showFinalSurpriseOnly để hiển thị đoạn văn
function showFinalSurpriseOnly() {
  console.log("Inside showFinalSurpriseOnly");
  sceneContainer.style.display = "none";
  document.getElementById("chat-box").style.display = "none";
  document.getElementById("controls").style.display = "none";

  const finalSurprise = document.getElementById("final-surprise");
  if (finalSurprise) {
    finalSurprise.classList.remove("hidden");
    finalSurprise.style.display = "flex";
    finalSurprise.style.visibility = "visible";
    finalSurprise.style.opacity = "1";

    // Cập nhật đoạn văn vào #final-message
    document.getElementById("final-message").textContent =
      generateFinalMessage();
    console.log(
      "Final message updated:",
      document.getElementById("final-message").textContent
    );
  } else {
    console.error("Element #final-surprise not found in HTML");
    document.body.innerHTML =
      '<h1 style="color: white; text-align: center;">ANH YÊU EM! (Fallback)</h1>';
  }
}

// Xử lý nút trong final-surprise
yesBtn.addEventListener("click", () => {
  document.body.innerHTML = `
  <video id="video-background" autoPlay muted loop>
    <source src="https://cdn-cf-east.streamable.com/video/mp4/uu0807.mp4?Expires=1742667725411&Key-Pair-Id=APKAIEYUVEN4EVB2OKEQ&Signature=ZkbwSmZQogso-b62I-gPv6~FEM1YuxWNi-QuEUHOVasFD~Wv6KLFiAw6hxKATueaT58KXoUaC66kV5sqwxR3ZkKj3eESH4oS6gyRUCduKfsnrUrmUQqzSrhsSkxGWT7lu59AxxemgtR~-Ww-EecT9Yjy3Fh-DM9euy-gbOaLpIvNUAPFPWKIr2GnUNKvxSY~d5OSPFr5oNmSm7uc7Y3syxrebVAGdbu6fZAE0kUFC3sE~9zxoTbYZfFfYLuHEH1v9VCo7TIctTjPOtcxrSnu0sn6RXBTTRVBAZZgUV51mreWENEylMkZ0tg6LoXNYN5itwOupUkHEtzRsLsWGGv8uA__" type="video/mp4">
    </video>
    <div class="loading">
      <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        width="500" height="200" viewBox="0 0 334 120" enable-background="new 0 0 334 120" xml:space="preserve">
        <filter id="blur-filter" x="-1" y="0" width="200" height="200">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
        <path class="linear-1" fill="none" stroke="#E21393" stroke-miterlimit="10" d="M31.333,90c0,0,38-29.333,69.333-15.333S167.333,97.333,184,85.333
          s31.638-47.49,14-69c-8.615-10.506-19.829-1.669-26,7.667c-3.619,5.474-4.667,12.667-4.667,12.667S151.637,12.315,141,29.333
          c-5,8-5.667,45.333,19.333,57C204.574,106.979,286.928,102.42,310,88"/>
        <path class="linear-1" fill="none" stroke="#F97DC4" stroke-miterlimit="10" d="M32.333,90c0,0,38-29.333,69.333-15.333S168.333,97.333,185,85.333
          s31.638-47.49,14-69c-8.615-10.506-19.829-1.669-26,7.667c-3.619,5.474-4.667,12.667-4.667,12.667S152.637,12.315,142,29.333
          c-5,8-5.667,45.333,19.333,57C205.574,106.979,287.928,102.42,311,88"/>
        <path class="linear-3" fill="none" stroke="#E21367" stroke-miterlimit="10" d="M36.333,90c0,0,38-29.333,69.333-15.333S172.333,97.333,189,85.333
          s31.638-47.49,14-69c-8.615-10.506-19.829-1.669-26,7.667c-3.619,5.474-4.667,12.667-4.667,12.667S156.637,12.315,146,29.333
          c-5,8-5.667,45.333,19.333,57C209.574,106.979,291.928,102.42,315,88"/>
        <path class="linear-4" fill="none" stroke="#F97DC4" stroke-miterlimit="10" d="M40.333,90c0,0,38-29.333,69.333-15.333S176.333,97.333,193,85.333
          s31.638-47.49,14-69c-8.615-10.506-19.829-1.669-26,7.667c-3.619,5.474-4.667,12.667-4.667,12.667S160.637,12.315,150,29.333
          c-5,8-5.667,45.333,19.333,57C213.574,106.979,295.928,102.42,319,88"/>
      </svg>
      <h1>Anh biết em sẽ đồng ý mà!</h1>
      <p>Hành trình vừa rồi thật đặc biệt: ${generateFinalMessage()}</p>
      <p>Mỗi ngày bên em là một ngày, và anh cảm ơn em vì đã làm trái tim anh rung lên từng nhịp hạnh phúc. Em chính là món quà tuyệt vời nhất mà anh có được!</p>
      <p>Từ giờ, mình sẽ cùng nhau tạo nên những kỷ niệm đẹp hơn nữa nhé. Anh hứa sẽ luôn làm em cười, dù đôi khi anh hơi ngố một chút!</p>
      <p>Cảm ơn em vì đã chọn anh. Tình yêu của chúng ta sẽ như dòng sông, chảy mãi không ngừng, và anh sẽ luôn ở bên em, hôm nay và mãi mãi.</p>
      <p>Yêu em thật nhiều,  của anh! Hãy để anh nắm tay em bước tiếp trên con đường hạnh phúc này, được không?</p>
      <h3>Phú Tài</h3>
    </div>
  `;

  // Thêm CSS động vào head
  const style = document.createElement("style");
  style.textContent = getValentineCSS();
  document.head.appendChild(style);

  // Thêm hiệu ứng fade-in
  document.querySelector(".loading").style.opacity = "0";
  setTimeout(() => {
    document.querySelector(".loading").style.transition = "opacity 1s ease";
    document.querySelector(".loading").style.opacity = "1";
  }, 100);
});

function getValentineCSS() {
  return `
@import url(https://fonts.googleapis.com/css?family=Dancing+Script);

body {
  background:transparent;
  color: white;
  font-family: 'Arial', sans-serif;
  text-align: center;
  margin: 0;
}
#video-background{
top:0;left:0;
width: 100%;
height: 100vh;
object-fit: cover;
position: fixed;
}
svg path.linear-1 {
  stroke: white;
  filter: url(#blur-filter);
}

.loading {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 0;
  position: relative;
}

.loading svg {
  height: 100%;
}

.loading .linear-1 {
  stroke-dasharray: 281;
  animation: dash 6s infinite linear forwards;
}

.loading .linear-2 {
  stroke-dasharray: 300;
  animation: dash 5s infinite linear forwards;
}

.loading .linear-3 {
  stroke-dasharray: 340;
  animation: dash 4s infinite linear forwards;
}

.loading .linear-4 {
  stroke-dasharray: 400;
  animation: dash 3s infinite linear forwards;
}

@keyframes dash {
  from {
    stroke-dashoffset: 814;
  }
  to {
    stroke-dashoffset: -814;
  }
}

h1 {
  text-shadow: 2px 2px 5px #E21393;
  margin: 20px 0 ;
}
p{
  margin: 20px 0 ;
}
a,
h3 {
  color: #fff;  margin: 20px 0 ;

}

a {
  text-decoration: none;  margin: 20px 0 ;

}

a:hover {
  color: #F97DC4;
}

@media (max-width: 768px) {
  h1 {
    font-size: 24px;
  }
}
    `;
}

thinkBtn.addEventListener("click", () => {
  thinkBtn.style.position = "absolute";
  thinkBtn.style.left = Math.random() * 80 + "vw";
  thinkBtn.style.top = Math.random() * 80 + "vh";
});

// Nút "Quay lại" (giữ nguyên)
backBtn.addEventListener("click", () => {
  pathMessageBox.classList.add("hidden");
  isMessageBoxOpen = false;
  collisionCooldown = 1000;
  lastCollisionTime = Date.now();

  if (currentScene === 1) {
    knightX = canvas.width / 2;
    knightY = canvas.height / 2;
  } else {
    if (
      Math.abs(knightX - canvas.width * 0.5) < 40 &&
      Math.abs(knightY - canvas.height * 0.1) < 40
    ) {
      knightY = canvas.height * 0.1 + 50;
    } else if (
      Math.abs(knightX - canvas.width * 0.5) < 40 &&
      Math.abs(knightY - canvas.height * 0.9) < 40
    ) {
      knightY = canvas.height * 0.9 - 50;
    } else if (
      Math.abs(knightX - canvas.width * 0.1) < 40 &&
      Math.abs(knightY - canvas.height * 0.5) < 40
    ) {
      knightX = canvas.width * 0.1 + 50;
    } else if (
      Math.abs(knightX - canvas.width * 0.9) < 40 &&
      Math.abs(knightY - canvas.height * 0.5) < 40
    ) {
      knightX = canvas.width * 0.9 - 50;
    }
  }
  isMovingLeft = false;
  isMovingRight = false;
  isMovingUp = false;
  isMovingDown = false;
});

// Cập nhật cảnh (giữ nguyên)
function updateScene() {
  narratorName.textContent = scenes[currentScene].narrator;
  pathNarratorName.textContent = scenes[currentScene].narrator;
  showChatMessage(
    `Chào em! Anh là ${scenes[currentScene].narrator} đây! Dùng nút điều khiển, phím mũi tên hoặc WASD để dẫn anh đến con đường em chọn nhé!`
  );
  lastMessageTime = Date.now();
  isMessageBoxOpen = false;
  pathMessageBox.classList.add("hidden");
  if (currentScene === 2) {
    knightX = canvas.width / 2;
    knightY = canvas.height / 2 + 100;
  }
}

//// Hiển thị bất ngờ cuối cùng (giữ nguyên)
// function showFinalSurprise() {
//   sceneContainer.style.display = "none";
//   finalSurprise.classList.remove("hidden");
//   isGameActive = false; // Đảm bảo dừng animation
// }

// yesBtn.addEventListener("click", () => {
//   alert(
//     "Anh biết mà! Đây là món quà nhỏ: Một bó hoa và nụ cười của anh đang chờ em ở đời thực!"
//   );
// });

// thinkBtn.addEventListener("click", () => {
//   thinkBtn.style.position = "absolute";
//   thinkBtn.style.left = Math.random() * 80 + "vw";
//   thinkBtn.style.top = Math.random() * 80 + "vh";
//   setTimeout(() => alert("Anh sẽ chờ em mãi!"), 1000);
// });

// Khởi tạo cảnh đầu tiên
updateScene();

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const startScreen = document.getElementById("start-screen");

  startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    // Bạn có thể bắt đầu khởi động game tại đây nếu cần
  });
});
