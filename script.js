// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB2jjVv9sGNVH1Zb7C0iEwr9yHrYv1vO1E",
    authDomain: "bumblebie-9cd7d.firebaseapp.com",
    databaseURL: "https://bumblebie-9cd7d-default-rtdb.firebaseio.com",
    projectId: "bumblebie-9cd7d",
    storageBucket: "bumblebie-9cd7d.firebasestorage.app",
    messagingSenderId: "293124755504",
    appId: "1:293124755504:web:fa7fd431b2938d70509df5",
    measurementId: "G-CYT4R8RCER"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  // Người chơi
  const tenNguoiChoi = prompt("Nhập tên của bạn:");
  const idNguoiChoi = "ID_" + Math.floor(Math.random() * 1000000);
  const nguoiChoiRef = db.ref("NguoiChoi/" + idNguoiChoi);
  
  // Canvas
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Bản đồ giới hạn
  const mapLimit = {
    left: -800,
    right: 800,
    top: -800,
    bottom: 800
  };
  
  // Ong của mình
  const bee = {
    x: 0,
    y: 0,
    size: 22,
    speed: 4,
    diem: 0
  };
  
  nguoiChoiRef.set({
    Ten: tenNguoiChoi,
    Diem: 0,
    ViTri: { x: bee.x, y: bee.y }
  });
  
  // Cập nhật vị trí
  setInterval(() => {
    nguoiChoiRef.child("ViTri").set({ x: bee.x, y: bee.y });
  }, 500);
  
  // Điều khiển
  const keys = {};
  document.addEventListener('keydown', (e) => keys[e.key] = true);
  document.addEventListener('keyup', (e) => keys[e.key] = false);
  
  // Hoa
  let danhSachHoa = [];
  function taoHoaNgauNhien(soLuong) {
    for (let i = 0; i < soLuong; i++) {
      danhSachHoa.push({
        x: Math.random() * (mapLimit.right - mapLimit.left) + mapLimit.left,
        y: Math.random() * (mapLimit.bottom - mapLimit.top) + mapLimit.top,
        size: 30
      });
    }
  }
  taoHoaNgauNhien(10);
  
  // Người chơi khác
  let nguoiChoiKhac = {};
  db.ref("NguoiChoi").on("value", (snapshot) => {
    const data = snapshot.val();
    nguoiChoiKhac = {};
    for (let id in data) {
      if (id !== idNguoiChoi) {
        nguoiChoiKhac[id] = data[id];
      }
    }
  });
  
  // Va chạm
  function kiemTraVaCham(ong, hoa) {
    const dx = ong.x - hoa.x;
    const dy = ong.y - hoa.y;
    return Math.sqrt(dx * dx + dy * dy) < (ong.size / 2 + hoa.size / 2);
  }
  
  // Game update
  function update() {
    if (keys.ArrowUp) bee.y -= bee.speed;
    if (keys.ArrowDown) bee.y += bee.speed;
    if (keys.ArrowLeft) bee.x -= bee.speed;
    if (keys.ArrowRight) bee.x += bee.speed;
  
    // Giới hạn trong map
    bee.x = Math.max(mapLimit.left, Math.min(mapLimit.right, bee.x));
    bee.y = Math.max(mapLimit.top, Math.min(mapLimit.bottom, bee.y));
  
    // Ăn hoa
    for (let i = danhSachHoa.length - 1; i >= 0; i--) {
      if (kiemTraVaCham(bee, danhSachHoa[i])) {
        danhSachHoa.splice(i, 1);
        bee.diem++;
        nguoiChoiRef.child("Diem").set(bee.diem);
        taoHoaNgauNhien(1);
      }
    }
  }
  
  // Vẽ game với camera
  function draw() {
    const camX = bee.x - canvas.width / 2;
    const camY = bee.y - canvas.height / 2;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camX, -camY);
  
    // Vẽ viền bản đồ
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 3;
    ctx.strokeRect(mapLimit.left, mapLimit.top, mapLimit.right - mapLimit.left, mapLimit.bottom - mapLimit.top);
  
    // Hoa
    for (let hoa of danhSachHoa) {
      ctx.fillStyle = 'pink';
      ctx.beginPath();
      ctx.arc(hoa.x, hoa.y, hoa.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  
    // Người chơi khác
    for (let id in nguoiChoiKhac) {
      const nguoi = nguoiChoiKhac[id];
      const vt = nguoi.ViTri;
      if (vt) {
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.ellipse(vt.x, vt.y, bee.size, bee.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
  
        ctx.fillStyle = "black";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(nguoi.Ten || "Người chơi", vt.x, vt.y - bee.size);
      }
    }
  
    // Ong của mình
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.ellipse(bee.x, bee.y, bee.size, bee.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  
    ctx.restore();
  
    // Điểm (góc trên trái)
    ctx.fillStyle = "black";
    ctx.font = "18px Arial";
    ctx.fillText(`Điểm: ${bee.diem}`, 20, 30);
  }
  
  // Game loop
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
  