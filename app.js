// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB2jjVv9sGNVH1Zb7C0iEwr9yHrYv1vO1E",
    authDomain: "bumblebie-9cd7d.firebaseapp.com",
    databaseURL: "https://bumblebie-9cd7d-default-rtdb.firebaseio.com",
    projectId: "bumblebie-9cd7d",
    storageBucket: "bumblebie-9cd7d.appspot.com",
    messagingSenderId: "293124755504",
    appId: "1:293124755504:web:fa7fd431b2938d70509df5",
    measurementId: "G-CYT4R8RCER"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const MAX_PLAYERS_PER_ROOM = 5;

localStorage.clear();

// Bản đồ giới hạn
const mapLimit = {
    left: -800,
    right: 800,
    top: -800,
    bottom: 800
};

// Joystick
let joystick = { dx: 0, dy: 0 };
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
let dragging = false;

if (joystickBase && joystickStick) {
    function startDrag(x, y) {
        dragging = true;
        moveStick(x, y);
    }
    function moveStick(clientX, clientY) {
        if (!dragging) return;
        const rect = joystickBase.getBoundingClientRect();
        const x = clientX - rect.left - rect.width / 2;
        const y = clientY - rect.top - rect.height / 2;
        const max = rect.width / 2;
        const len = Math.min(Math.sqrt(x * x + y * y), max);
        const angle = Math.atan2(y, x);
        const dx = Math.cos(angle) * len;
        const dy = Math.sin(angle) * len;
        joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        joystick.dx = dx / max;
        joystick.dy = dy / max;
    }
    function endDrag() {
        dragging = false;
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystick.dx = 0;
        joystick.dy = 0;
    }

    // Touch events
    joystickBase.addEventListener('touchstart', e => {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
    }, { passive: true });
    joystickBase.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        moveStick(touch.clientX, touch.clientY);
    }, { passive: true });
    joystickBase.addEventListener('touchend', endDrag);

    // Mouse events
    joystickBase.addEventListener('mousedown', e => {
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', e => {
        if (!dragging) return;
        moveStick(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', e => {
        if (dragging) {
            endDrag();
        }
    });
} else {
    console.warn("Joystick elements không tìm thấy trên trang.");
}

// Người chơi
const tenNguoiChoi = prompt("Nhập tên của bạn:") || "Người chơi";
const idNguoiChoi = "ID_" + Math.floor(Math.random() * 1000000);

// Tìm hoặc tạo phòng có chỗ trống
async function findOrCreateRoom() {
    const phongRef = db.ref("Phong");
    const snapshot = await phongRef.once("value");
    const Phong = snapshot.val() || {};

    for (let roomId in Phong) {
        const nguoiChoi = Phong[roomId].NguoiChoi || {};
        if (Object.keys(nguoiChoi).length < MAX_PLAYERS_PER_ROOM) {
            return roomId;
        }
    }

    // Tạo phòng mới
    const newRoomId = "P_" + Math.floor(Math.random() * 222);
    await phongRef.child(newRoomId).set({}); // tạo phòng trống
    return newRoomId;
}

// Khởi tạo game chính
async function startGame() {
    const roomId = await findOrCreateRoom();
    console.log("Bạn tham gia phòng:", roomId);

    const nguoiChoiRef = db.ref("Phong/" + roomId + "/DanhSachNguoiChoi/" + idNguoiChoi);
    const roomNguoiChoiRef = db.ref("Phong/" + roomId + "/DanhSachNguoiChoi");

    // Đăng ký người chơi mới
    await nguoiChoiRef.set({ Ten: tenNguoiChoi, Diem: 0, ViTri: { x: 0, y: 0 } });

    // Xóa người chơi khi rời trang để giải phóng chỗ
    window.addEventListener("beforeunload", () => {
        nguoiChoiRef.remove();
    });

    // Canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const bee = {
        x: 0,
        y: 0,
        size: 22,
        speed: 4,
        diem: 0
    };

    const flowerImgPaths = [
        'assets/flower01.svg', 'assets/flower02.svg', 'assets/flower03.svg', 'assets/flower04.svg',
        'assets/flower05.svg', 'assets/flower06.svg', 'assets/flower07.svg', 'assets/flower08.svg',
        'assets/flower09.svg', 'assets/flower10.svg', 'assets/flower11.svg', 'assets/flower12.svg', 'assets/flower13.svg'
    ];
    const flowerImages = [];
    let flowerImagesLoaded = 0;

    const beeImg = new Image();
    beeImg.src = 'assets/bee.svg';
    let beeImgLoaded = false;
    beeImg.onload = () => { beeImgLoaded = true; checkAllImagesLoaded(); };

    const beeOtherImg = new Image();
    beeOtherImg.src = 'assets/beeother.svg';
    let beeOtherImgLoaded = false;
    beeOtherImg.onload = () => { beeOtherImgLoaded = true; checkAllImagesLoaded(); };

    function checkAllImagesLoaded() {
        if (flowerImagesLoaded === flowerImgPaths.length && beeImgLoaded && beeOtherImgLoaded) {
            taoHoaNgauNhien(12);
            gameLoop();
        }
    }

    flowerImgPaths.forEach((path) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            flowerImagesLoaded++;
            checkAllImagesLoaded();
        };
        flowerImages.push(img);
    });

    nguoiChoiRef.set({ Ten: tenNguoiChoi, Diem: 0, ViTri: { x: bee.x, y: bee.y } });

    // Cập nhật vị trí và điểm lên Firebase
    setInterval(() => {
        nguoiChoiRef.child("ViTri").set({ x: bee.x, y: bee.y });
        nguoiChoiRef.child("Diem").set(bee.diem);
    }, 500);

    const keys = {};
    document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

    let nguoiChoiKhac = {};
    roomNguoiChoiRef.on("value", snapshot => {
        const data = snapshot.val() || {};
        nguoiChoiKhac = {};
        for (let id in data) {
            if (id !== idNguoiChoi) {
                nguoiChoiKhac[id] = data[id];
            }
        }
    });

    let danhSachHoa = [];
    const danhSachHoaRef = db.ref("Phong/" + roomId + "/DanhSachHoa");
    // Khi có dữ liệu hoa từ Firebase, cập nhật danhSachHoa local
    danhSachHoaRef.on("value", snapshot => {
        const data = snapshot.val();
        if (data) {
            danhSachHoa = data;
        } else {
            // Nếu chưa có hoa, tạo hoa mới và đẩy lên Firebase
            danhSachHoa = taoHoaNgauNhien(12);
            danhSachHoaRef.set(danhSachHoa);
        }
    });

    function taoHoaNgauNhien(soLuong) {
        const hoaMoi = [];
        for (let i = 0; i < soLuong; i++) {
            hoaMoi.push({
                x: Math.random() * (mapLimit.right - mapLimit.left - 60) + mapLimit.left + 30,
                y: Math.random() * (mapLimit.bottom - mapLimit.top - 60) + mapLimit.top + 30,
                size: 30,
                imgIndex: Math.floor(Math.random() * flowerImages.length)
            });
        }
        return hoaMoi;
    }    

    function kiemTraVaCham(ong, hoa) {
        const dx = ong.x - hoa.x;
        const dy = ong.y - hoa.y;
        return Math.sqrt(dx * dx + dy * dy) < (ong.size / 2 + hoa.size / 2);
    }

    function gioiHanToaDo() {
        bee.x = Math.max(mapLimit.left + bee.size / 2, Math.min(mapLimit.right - bee.size / 2, bee.x));
        bee.y = Math.max(mapLimit.top + bee.size / 2, Math.min(mapLimit.bottom - bee.size / 2, bee.y));
    }

    function update() {
        const dx = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0) + joystick.dx;
        const dy = (keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0) + joystick.dy;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            bee.x += (dx / len) * bee.speed;
            bee.y += (dy / len) * bee.speed;
        }

        gioiHanToaDo();

        for (let i = danhSachHoa.length - 1; i >= 0; i--) {
            if (kiemTraVaCham(bee, danhSachHoa[i])) {
                danhSachHoa.splice(i, 1);
                bee.diem++;
        
                // Tạo hoa mới (1 cái) và cập nhật Firebase
                const hoaMoi = taoHoaNgauNhien(1);
                danhSachHoa = danhSachHoa.concat(hoaMoi);
                danhSachHoaRef.set(danhSachHoa);
            }
        }        
    }

    function draw() {
        const camX = bee.x - canvas.width / 2;
        const camY = bee.y - canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-camX, -camY);

        ctx.strokeStyle = "#888";
        ctx.lineWidth = 3;
        ctx.strokeRect(mapLimit.left, mapLimit.top, mapLimit.right - mapLimit.left, mapLimit.bottom - mapLimit.top);

        for (let hoa of danhSachHoa) {
            const img = flowerImages[hoa.imgIndex];
            if (img) {
                ctx.drawImage(img, hoa.x - hoa.size / 2, hoa.y - hoa.size / 2, hoa.size, hoa.size);
            }
        }

        for (let id in nguoiChoiKhac) {
            const nguoi = nguoiChoiKhac[id];
            const vt = nguoi.ViTri;
            if (vt) {
                if (beeOtherImgLoaded) {
                    const w = bee.size * 2;
                    const h = bee.size * 2;
                    ctx.drawImage(beeOtherImg, vt.x - w / 2, vt.y - h / 2, w, h);
                } else {
                    ctx.fillStyle = 'gray';
                    ctx.beginPath();
                    ctx.ellipse(vt.x, vt.y, bee.size, bee.size, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.fillStyle = 'black';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(nguoi.Ten || 'Ẩn danh', vt.x, vt.y - bee.size);
            }
        }

        if (beeImgLoaded) {
            const w = bee.size * 2;
            const h = bee.size * 2;
            ctx.drawImage(beeImg, bee.x - w / 2, bee.y - h / 2, w, h);
        } else {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.ellipse(bee.x, bee.y, bee.size, bee.size, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.fillStyle = 'yellow';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tenNguoiChoi, bee.x, bee.y - bee.size);


        ctx.restore();
        ctx.fillStyle = 'black';
        ctx.font = '18px Arial';
        ctx.fillText(`Điểm: ${bee.diem}`, 20, 30);

    }

    const leaderboardList = document.getElementById('leaderboardList');
    roomNguoiChoiRef.on("value", snapshot => {
        const data = snapshot.val() || {};
        const players = Object.values(data);
        players.sort((a, b) => (b.Diem || 0) - (a.Diem || 0));
        const top5 = players.slice(0, 5);
        leaderboardList.innerHTML = top5.map(p =>
            `<li><strong>${p.Ten || 'Ẩn danh'}</strong> - ${p.Diem || 0} điểm</li>`
        ).join('');
    });

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}
startGame();