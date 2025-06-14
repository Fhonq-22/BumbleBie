// Cấu hình Firebase
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
  
  // Bản đồ giới hạn
  const mapLimit = {
    left: -800,
    right: 800,
    top: -800,
    bottom: 800
  };
  
  // Người chơi
  const tenNguoiChoi = prompt("Nhập tên của bạn:") || "Người chơi";
  const idNguoiChoi = "ID_" + Math.floor(Math.random() * 1000000);
  const nguoiChoiRef = db.ref("NguoiChoi/" + idNguoiChoi);
  
  // Canvas
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Ong của mình
  const bee = {
    x: 0,
    y: 0,
    size: 40,
    speed: 4,
    diem: 0
  };
  
  // Ghi dữ liệu người chơi lên Firebase lúc đầu
  nguoiChoiRef.set({
    Ten: tenNguoiChoi,
    Diem: 0,
    ViTri: { x: bee.x, y: bee.y }
  });
  
  // Cập nhật vị trí và điểm liên tục mỗi 500ms
  setInterval(() => {
    nguoiChoiRef.child("ViTri").set({ x: bee.x, y: bee.y });
    nguoiChoiRef.child("Diem").set(bee.diem);
  }, 500);
  
  // Điều khiển
  const keys = {};
  document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
  
  // Danh sách hoa
  let danhSachHoa = [];
  function taoHoaNgauNhien(soLuong) {
    for (let i = 0; i < soLuong; i++) {
      danhSachHoa.push({
        x: Math.random() * (mapLimit.right - mapLimit.left - 60) + mapLimit.left + 30,
        y: Math.random() * (mapLimit.bottom - mapLimit.top - 60) + mapLimit.top + 30,
        size: 30
      });
    }
  }
  taoHoaNgauNhien(15);
  
  // Người chơi khác
  let nguoiChoiKhac = {};
  db.ref("NguoiChoi").on("value", snapshot => {
    const data = snapshot.val() || {};
    nguoiChoiKhac = {};
    for (let id in data) {
      if (id !== idNguoiChoi) {
        nguoiChoiKhac[id] = data[id];
      }
    }
  });
  
  // Kiểm tra va chạm
  function kiemTraVaCham(ong, hoa) {
    const dx = ong.x - hoa.x;
    const dy = ong.y - hoa.y;
    return Math.sqrt(dx * dx + dy * dy) < (ong.size / 2 + hoa.size / 2);
  }
  
  // Giới hạn tọa độ trong bản đồ âm dương
  function gioiHanToaDo() {
    bee.x = Math.max(mapLimit.left + bee.size / 2, Math.min(mapLimit.right - bee.size / 2, bee.x));
    bee.y = Math.max(mapLimit.top + bee.size / 2, Math.min(mapLimit.bottom - bee.size / 2, bee.y));
  }
  
  // Cập nhật game
  function update() {
    if (keys['arrowup'] || keys['w']) bee.y -= bee.speed;
    if (keys['arrowdown'] || keys['s']) bee.y += bee.speed;
    if (keys['arrowleft'] || keys['a']) bee.x -= bee.speed;
    if (keys['arrowright'] || keys['d']) bee.x += bee.speed;
  
    gioiHanToaDo();
  
    // Ăn hoa
    for (let i = danhSachHoa.length - 1; i >= 0; i--) {
      if (kiemTraVaCham(bee, danhSachHoa[i])) {
        danhSachHoa.splice(i, 1);
        bee.diem++;
        taoHoaNgauNhien(1);
      }
    }
  }
  
  // Vẽ game
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
  
    // Vẽ hoa
    for (let hoa of danhSachHoa) {
      ctx.fillStyle = 'pink';
      ctx.beginPath();
      ctx.arc(hoa.x, hoa.y, hoa.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  
    // Vẽ người chơi khác
    for (let id in nguoiChoiKhac) {
      const nguoi = nguoiChoiKhac[id];
      const vt = nguoi.ViTri;
      if (vt) {
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.ellipse(vt.x, vt.y, bee.size, bee.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
  
        ctx.fillStyle = 'black';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(nguoi.Ten || 'Người chơi', vt.x, vt.y - bee.size);
      }
    }
  
    // Vẽ ong của mình
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.ellipse(bee.x, bee.y, bee.size, bee.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  
    ctx.restore();
  
    // Vẽ điểm góc màn hình
    ctx.fillStyle = 'black';
    ctx.font = '18px Arial';
    ctx.fillText(`Điểm: ${bee.diem}`, 20, 30);
  }
  
  // Leaderboard realtime
  const leaderboardList = document.getElementById('leaderboardList');
  db.ref("NguoiChoi").on("value", snapshot => {
    const data = snapshot.val() || {};
    const players = Object.values(data);
    players.sort((a, b) => (b.Diem || 0) - (a.Diem || 0));
    const top5 = players.slice(0, 5);
    leaderboardList.innerHTML = top5.map(p =>
      `<li><strong>${p.Ten || 'Không tên'}</strong> - ${p.Diem || 0} điểm</li>`
    ).join('');
  });
  
  // Vòng lặp game chính
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
  