const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
  container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
  container.classList.remove("active");
});

document.addEventListener("DOMContentLoaded", () => {
  const discordBtn = document.getElementById("discordBtn");

  if (discordBtn) {
    discordBtn.addEventListener("click", function () {
      Swal.fire({
        icon: 'info',
        title: ' Hãy Liên hệ Admin',
        text: 'Vui Lòng Tham Gia Vào Máy Chủ Discord Để Được Cấp Tài Khoản.',
        confirmButtonText: 'Mở Discord'
      }).then((result) => {
        if (result.isConfirmed) {
          window.open("https://discord.gg/YVAact85mz", "_blank");
        }
      });
    });
  }

  const loginForm = document.querySelector(".sign-in form");

  const approvedAccounts = [
    { email: "pt1@gmail.com", password: "123", code: "PT123" },
    { email: "tai1@admin.com", password: "456", code: "ADMIN456" },
    { email: "pt2@gmail.com", password: "123", code: "PT123" },
    { email: "tai2@admin.com", password: "456", code: "ADMIN456" },
    { email: "pt3@gmail.com", password: "123", code: "PT123" },
    { email: "kimanh@member.com", password: "199123", code: "MEMBER011" }
  ];

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = this.querySelector('input[type="email"]').value.trim();
    const password = this.querySelector('input[type="password"]').value.trim();

    const match = approvedAccounts.find(
      acc => acc.email === email && acc.password === password
    );

    if (match) {
      Swal.fire({
        title: 'Nhập Mã Xác Thực',
        input: 'text',
        inputLabel: 'Mã Do Admin Cấp',
        inputPlaceholder: 'Nhập Mã Xác Thực Tại Đây',
        showCancelButton: true,
        confirmButtonText: 'Xác Nhận',
      }).then((result) => {
        if (result.isConfirmed) {
          if (result.value === match.code) {
            Swal.fire('Thành Công!', 'Đăng Nhập Hoàn Tất!', 'success');
            localStorage.setItem("loggedIn", "true");
            window.location.href = "profile.html";
          } else {
            Swal.fire('Mã Xác Thực Sai!', 'Vui Lòng Liên Hệ Lại Admin.', 'error');
          }
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Thất Bại',
        text: 'Tài Khoản Hoặc KeyPass Sai!'
      });
    }
  });
});