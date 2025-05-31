
    const typewriter = document.getElementById("typewriter-text");
    const phrases = [
        "ENGLISH. ",
        "WELCOME TO WEBSITE ! ",
        "I'M A DEVELOPER, PHU TAI. ! ",
        "VIETNAMESE. ",
        "CHÀO MỪNG BẠN ĐẾN VỚI WEBSITE ! ",
        "TÔI LÀ NHÀ PHÁT TRIỂN, PHÚ TÀI. ! ",
    ];
    let i = 0, j = 0;
    let currentPhrase = [];
    let isDeleting = false;

    function loop() {
        typewriter.innerHTML = currentPhrase.join("");

        if (!isDeleting && j <= phrases[i].length) {
            currentPhrase.push(phrases[i][j]);
            j++;
        }

        if (isDeleting && j > 0) {
            currentPhrase.pop();
            j--;
        }

        if (j === phrases[i].length) {
            isDeleting = true;
            setTimeout(loop, 1500);
            return;
        }

        if (isDeleting && j === 0) {
            isDeleting = false;
            i = (i + 1) % phrases.length;
        }

        const speed = isDeleting ? 50 : 100;
        setTimeout(loop, speed);
    }
    loop();

    const music = document.getElementById("bg-music");
    const trigger = document.getElementById("music-trigger");

    trigger.addEventListener("click", () => {
        music.play().catch(err => console.log("Music failed:", err));
        trigger.style.display = "none";
    });



let fpsDisplay = document.getElementById("fps-meter");
let lastFrameTime = performance.now();
let frames = 0;

function fpsLoop(now) {
    frames++;
    if (now - lastFrameTime >= 1000) {
        fpsDisplay.textContent = `FPS: ${frames}`;
        frames = 0;
        lastFrameTime = now;
    }
    requestAnimationFrame(fpsLoop);
}
requestAnimationFrame(fpsLoop);



const paragraph = document.querySelector('.box--paragraph');

document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    paragraph.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
});



function animateSkills() {
  const fills = document.querySelectorAll('.fill');
  fills.forEach(fill => {
    const target = parseInt(fill.getAttribute('data-percent'));
    fill.style.width = target + "%";

    const percentText = fill.parentElement.previousElementSibling.querySelector(".percent");
    let current = 0;
    const interval = setInterval(() => {
      if (current >= target) {
        clearInterval(interval);
      } else {
        current++;
        percentText.textContent = current + "%";
      }
    }, 40); 
  });
}

window.addEventListener("load", animateSkills);



document.addEventListener("click", function(e) {
    const flower = document.createElement("div");
    flower.classList.add("sakura");
    flower.style.left = `${e.clientX - 10}px`;
    flower.style.top = `${e.clientY - 10}px`;
    document.body.appendChild(flower);

    setTimeout(() => flower.remove(), 3000); 
});



function toggleMenu() {
  const menu = document.getElementById("side-menu");
  menu.style.left = (menu.style.left === "0px") ? "-250px" : "0px";
}
function toggleSubMenu() {
  const submenu = document.getElementById("submenu");
  submenu.style.display = submenu.style.display === "block" ? "none" : "block";
}



  window.onload = function () {
    setTimeout(() => {
      document.getElementById("hp-fill").style.width = "70%";
    }, 300);
  };
