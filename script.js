const firebaseConfig = {
    apiKey: "AIzaSyB2jjVv9sGNVH1Zb7C0iEwr9yHrYv1vO1E",
    authDomain: "bumblebie-9cd7d.firebaseapp.com",
    databaseURL: "https://bumblebie-9cd7d-default-rtdb.firebaseio.com", // 👈 dòng này quan trọng
    projectId: "bumblebie-9cd7d",
    storageBucket: "bumblebie-9cd7d.firebasestorage.app",
    messagingSenderId: "293124755504",
    appId: "1:293124755504:web:fa7fd431b2938d70509df5",
    measurementId: "G-CYT4R8RCER"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  // Nhập tên người chơi
  const tenNguoiChoi = prompt("Nhập tên của bạn:");
  const idNguoiChoi = "id_" + Math.floor(Math.random() * 1000000);
  
  // Tham chiếu người chơi trong Firebase
  const nguoiChoiRef = db.ref("BumbleBie/NguoiChoi/" + idNguoiChoi);
  
  // Canvas setup
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Tạo ong ban đầu
  const bee = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speed: 4,
    diem: 0
  };
  
  // Khởi tạo dữ liệu người chơi trong Firebase
  nguoiChoiRef.set({
    ten: tenNguoiChoi,
    diem: bee.diem,
    vi_tri: {
      x: bee.x,
      y: bee.y
    }
  });
  
  // Gửi vị trí ong lên Firebase mỗi 500ms
  function capNhatViTriFirebase() {
    nguoiChoiRef.child("ViTri").set({
      x: bee.x,
      y: bee.y
    });
  }
  setInterval(capNhatViTriFirebase, 500);
  
  // Lắng nghe phím điều khiển
  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
  };
  
  document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
  });
  document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
  });
  
  // Cập nhật vị trí ong
  function update() {
    if (keys.ArrowUp) bee.y -= bee.speed;
    if (keys.ArrowDown) bee.y += bee.speed;
    if (keys.ArrowLeft) bee.x -= bee.speed;
    if (keys.ArrowRight) bee.x += bee.speed;
  
    // Giới hạn không cho ong bay ra ngoài canvas
    bee.x = Math.max(bee.size / 2, Math.min(canvas.width - bee.size / 2, bee.x));
    bee.y = Math.max(bee.size / 2, Math.min(canvas.height - bee.size / 2, bee.y));
  }
  
  // Vẽ ong (tạm bằng ellipse vàng)
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Ong – hình ellipse vàng
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.ellipse(bee.x, bee.y, bee.size, bee.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  
  // Game loop
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
  
  gameLoop();
  