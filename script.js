// 使用Matter.js物理引擎
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;
const Common = Matter.Common;
const Composite = Matter.Composite;
const Constraint = Matter.Constraint;
const Query = Matter.Query;

// 全局变量
let packageCount = 0; // 默认包裹数量为0
let gameStarted = false; // 游戏是否已开始
let gameOver = false; // 游戏是否结束
let distance = 0; // 行驶距离
let hasAddedPackage = false; // 是否曾经添加过包裹
let totalEarnings = 0; // 新增：总收入
let deliveredPackageCount = 0; // 新增：成功派送的包裹数量
let droppedPackageCount = 0; // 新增：掉落的包裹数量
let pendingOrderCount = 1; // 新增：待处理订单数量
let orderIncreaseInterval = null; // 新增：订单增长计时器

// 新增时间场景变量
let timeSceneIndex = 0; // 0: 白天, 1: 黄昏, 2: 黑夜
const timeScenes = [
    { name: "白天", bg: "bg.png", road: "bg_road.png", building: "bg_building.png" },
    { name: "黄昏", bg: "bg_dusk.png", road: "bg_road_dusk.png", building: "bg_building_dusk.png" },
    { name: "黑夜", bg: "bg_night.png", road: "bg_road_night.png", building: "bg_building_night.png" }
];

// 新增星级和计时器变量
let starCount = 5; // 初始5颗星
let gameTimer = null; // 游戏计时器
let gameTime = 60; // 游戏时间60秒
let isTimerStarted = false; // 计时器是否已启动

// 游戏物理对象的全局引用
let blocks = [];
let world;
let initialMotoX;
let motoWidth;
let motoHeight;
let motoY;

// 当前显示的客户信息
let currentCustomer = null;
let currentRequest = null;

// 客户数据
const customers = [
    {
        name: "林教授",
        identity: "大学教授",
        requests: [
            { height: 1.0, text: "请帮我送这份重要学术论文，不要弄皱了！" },
            { height: 1.5, text: "这箱参考书对我的研究很重要，麻烦小心搬运。" },
            { height: 2.0, text: "我的实验设备在里面，很贵重，务必平稳送达！" }
        ]
    },
    {
        name: "张奶奶",
        identity: "退休老人",
        requests: [
            { height: 1.0, text: "小伙子，帮我把这些手工饼干送给我的孙子吧。" },
            { height: 1.5, text: "这是我织的毛衣，寄给在城里上学的孙女。" },
            { height: 2.0, text: "过年了，这些家乡特产要送给城里的亲戚。" }
        ]
    },
    {
        name: "王老板",
        identity: "电子商务店主",
        requests: [
            { height: 1.0, text: "今天的订单特别多，这是第一批，麻烦快送！" },
            { height: 1.5, text: "客人催得紧，这批电子产品要当天送达！" },
            { height: 2.0, text: "年终大促销，仓库都发不过来了，辛苦了！" }
        ]
    },
    {
        name: "陈设计师",
        identity: "自由设计师",
        requests: [
            { height: 1.0, text: "这是客户的设计稿，很重要，不能有任何损坏。" },
            { height: 1.5, text: "我的作品集和样品，要参加展览，请小心运送。" },
            { height: 2.0, text: "这些是定制艺术品，价值不菲，请务必安全送达。" }
        ]
    },
    {
        name: "李医生",
        identity: "社区医生",
        requests: [
            { height: 1.0, text: "这些药品要尽快送到病人家里，路上小心。" },
            { height: 1.5, text: "这批医疗用品很紧急，请优先配送！" },
            { height: 2.0, text: "医疗设备，贵重易碎，需要平稳运输，拜托了！" }
        ]
    },
    {
        name: "赵主厨",
        identity: "餐厅主厨",
        requests: [
            { height: 1.0, text: "这是今天的特色外卖，要保持温度，快送！" },
            { height: 1.5, text: "客人预订的节日大餐，记得保持新鲜度。" },
            { height: 2.0, text: "这批食材很珍贵，是为重要宴会准备的，请小心运送。" }
        ]
    },
    {
        name: "钱大爷",
        identity: "退休工程师",
        requests: [
            { height: 1.0, text: "帮我寄些自家种的蔬菜给孩子，新鲜着呢。" },
            { height: 1.5, text: "我修好的老物件，要还给朋友，别磕着碰着。" },
            { height: 2.0, text: "这是我收藏多年的老工具，送给博物馆，请妥善保管。" }
        ]
    },
    {
        name: "孙小姐",
        identity: "网络博主",
        requests: [
            { height: 1.0, text: "这是我的新视频设备，粉丝们都等着直播呢！" },
            { height: 1.5, text: "赞助商的产品，要拍开箱视频，麻烦送快点！" },
            { height: 2.0, text: "我的所有直播装备都在这了，可值不少钱呢！" }
        ]
    },
    {
        name: "刘创业者",
        identity: "科技创业者",
        requests: [
            { height: 1.0, text: "这是我们最新产品的样品，要送去投资人那里。" },
            { height: 1.5, text: "重要的产品原型，明天要展示给客户，请务必今天送到。" },
            { height: 2.0, text: "我们的核心设备，价值连城，需要特别小心！" }
        ]
    },
    {
        name: "周大学生",
        identity: "在校大学生",
        requests: [
            { height: 1.0, text: "这是我的课程作业，麻烦今天送到学校。" },
            { height: 1.5, text: "帮我把这些书送回学校图书馆，已经逾期了！" },
            { height: 2.0, text: "这是我的毕业设计成果，可千万别出差错啊！" }
        ]
    }
];

// 固定摩托车和包裹的尺寸
const fixedMotoWidth = 150*1.5; // 固定宽度
const fixedMotoHeight = 100*1.5; // 固定高度
const fixedPackageWidth = 50*1.5; // 固定包裹宽度
const fixedPackageHeight = 30*1; // 固定包裹高度

// 添加单个包裹的函数
function addPackage() {
    if (!gameStarted || gameOver || packageCount >= 100) return; // 检查游戏状态和包裹上限
    
    // 减少待处理订单数量
    if (pendingOrderCount > 0) {
        pendingOrderCount--;
        
        // 更新订单数字显示
        const orderCountElement = document.getElementById('order-count');
        if (orderCountElement) {
            orderCountElement.textContent = pendingOrderCount;
            
            // 根据订单数量调整颜色
            if (pendingOrderCount > 10) {
                orderCountElement.style.backgroundColor = '#ff0000';
            } else if (pendingOrderCount > 5) {
                orderCountElement.style.backgroundColor = '#ff4500';
            } else {
                orderCountElement.style.backgroundColor = '#ff4b2b';
            }
        }
    }
    
    // 显示随机客户的需求
    showRandomCustomerRequest();
}

// 显示随机客户需求的函数
function showRandomCustomerRequest() {
    // 随机选择一个客户
    const randomCustomerIndex = Math.floor(Math.random() * customers.length);
    currentCustomer = customers[randomCustomerIndex];
    
    // 随机选择包裹高度倍数
    const heightMultipliers = [1.0, 1.5, 2.0];
    const randomMultiplierIndex = Math.floor(Math.random() * heightMultipliers.length);
    const heightMultiplier = heightMultipliers[randomMultiplierIndex];
    
    // 找到对应高度的需求
    currentRequest = currentCustomer.requests.find(req => req.height === heightMultiplier);
    
    // 生成随机派送距离和收入
    const deliveryDistance = Math.floor(Math.random() * (300 - 50 + 1)) + 50; // 50-300米
    const deliveryEarning = Math.floor(Math.random() * 10) + 1; // 1-10元
    
    // 将派送信息添加到当前请求中
    currentRequest.deliveryDistance = deliveryDistance;
    currentRequest.deliveryEarning = deliveryEarning;
    
    // 更新UI
    const customerPopup = document.getElementById('customer-popup');
    const customerName = document.getElementById('customer-name');
    const customerIdentity = document.getElementById('customer-identity');
    const customerRequest = document.getElementById('customer-request');
    const packageIcon = document.getElementById('package-icon');
    const packageSize = document.getElementById('package-size');
    
    customerName.textContent = currentCustomer.name;
    customerIdentity.textContent = currentCustomer.identity;
    customerRequest.textContent = currentRequest.text;
    
    // 根据包裹高度设置图标样式和尺寸标签
    packageIcon.className = 'package-icon';
    
    if (heightMultiplier === 1.0) {
        packageIcon.classList.add('small');
        packageSize.textContent = '小型包裹';
        packageSize.style.backgroundColor = '#e3f2fd';
        packageSize.style.color = '#1976D2';
        console.log(`订单界面: 小型包裹图标 - 高度比例: 1.0`);
    } else if (heightMultiplier === 1.5) {
        packageIcon.classList.add('medium');
        packageSize.textContent = '中型包裹';
        packageSize.style.backgroundColor = '#E8F5E9';
        packageSize.style.color = '#2E7D32';
        console.log(`订单界面: 中型包裹图标 - 高度比例: 1.5`);
    } else if (heightMultiplier === 2.0) {
        packageIcon.classList.add('large');
        packageSize.textContent = '大型包裹';
        packageSize.style.backgroundColor = '#FFF3E0';
        packageSize.style.color = '#E65100';
        console.log(`订单界面: 大型包裹图标 - 高度比例: 2.0`);
    }
    
    // 添加派送距离和收入信息
    const deliveryInfo = document.createElement('div');
    deliveryInfo.id = 'delivery-info';
    deliveryInfo.className = 'delivery-info';
    deliveryInfo.innerHTML = `
        <div class="delivery-item">
            <span class="delivery-label">派送距离:</span>
            <span class="delivery-value">${deliveryDistance}米</span>
        </div>
        <div class="delivery-item">
            <span class="delivery-label">收入:</span>
            <span class="delivery-value">${deliveryEarning}元</span>
        </div>
    `;
    
    // 检查是否已存在派送信息，如果存在则移除
    const existingDeliveryInfo = document.getElementById('delivery-info');
    if (existingDeliveryInfo) {
        existingDeliveryInfo.parentNode.removeChild(existingDeliveryInfo);
    }
    
    // 在包裹信息下方插入派送信息
    const packageInfo = document.querySelector('.package-info');
    packageInfo.parentNode.insertBefore(deliveryInfo, packageInfo.nextSibling);
    
    // 显示弹窗
    customerPopup.style.display = 'block';
    
    // 添加按钮事件监听器
    const acceptBtn = document.getElementById('accept-request');
    const declineBtn = document.getElementById('decline-request');
    
    // 移除可能存在的旧事件监听器
    const newAcceptBtn = acceptBtn.cloneNode(true);
    const newDeclineBtn = declineBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    declineBtn.parentNode.replaceChild(newDeclineBtn, declineBtn);
    
    // 添加新的事件监听器
    newAcceptBtn.addEventListener('click', function() {
        // 隐藏弹窗
        customerPopup.style.display = 'none';
        
        // 创建包裹
        createPackageWithHeight(currentRequest.height);
    });
    
    newDeclineBtn.addEventListener('click', function() {
        // 隐藏弹窗
        customerPopup.style.display = 'none';
        
        // 重置当前客户和需求
        currentCustomer = null;
        currentRequest = null;
    });
}

// 根据指定高度创建包裹
function createPackageWithHeight(heightMultiplier) {
    if (packageCount >= 100) return;
    
    // 确定包裹尺寸类型和样式
    let packageSizeType, borderColor;
    if (heightMultiplier === 1.0) {
        packageSizeType = "小型包裹";
        borderColor = "#90CAF9";
    } else if (heightMultiplier === 1.5) {
        packageSizeType = "中型包裹";
        borderColor = "#66BB6A";
    } else if (heightMultiplier === 2.0) {
        packageSizeType = "大型包裹";
        borderColor = "#FFA726";
    }
    
    // 第一次添加包裹时，启动游戏计时器
    if (!isTimerStarted && !gameOver) {
        startGameTimer();
        isTimerStarted = true;
    }
    
    // 获取当前请求的派送距离和收入
    const deliveryDistance = currentRequest.deliveryDistance;
    const deliveryEarning = currentRequest.deliveryEarning;
    
    const packageImg = new Image();
    packageImg.src = 'package.png';
    const rearSeatX = initialMotoX - motoWidth * 0.3;
    const baseY = motoY - motoHeight * 0.5;
    
    packageImg.onload = function() {
        const imgRatio = packageImg.width / packageImg.height;
        
        // 应用指定高度
        const packageHeight = fixedPackageHeight * heightMultiplier;
        const verticalSpacing = packageHeight * 0.2;
        
        console.log(`游戏中: ${packageSizeType} - 高度比例: ${heightMultiplier}, 实际高度: ${packageHeight}px`);
        
        // 计算当前所有包裹的累计高度
        let totalExistingHeight = 0;
        blocks.forEach(block => {
            // 使用包裹的实际高度（从渲染属性中获取）
            const blockHeight = block.bounds.max.y - block.bounds.min.y;
            totalExistingHeight += blockHeight + verticalSpacing;
        });
        
        // 计算新包裹的位置，根据当前已有包裹的累计高度
        const packageX = rearSeatX + (Math.random() - 0.5) * fixedPackageWidth * 0.05;
        
        // 动态调整起始堆叠位置
        let packageY;
        
        if (blocks.length === 0) {
            // 如果是第一个包裹，放在基准位置
            packageY = baseY;
        } else {
            // 找到最上面的包裹
            let highestPackage = blocks[0];
            blocks.forEach(block => {
                if (block.position.y < highestPackage.position.y) {
                    highestPackage = block;
                }
            });
            
            // 新包裹放在最上面包裹的上方，加上足够的间距
            packageY = highestPackage.position.y - (packageHeight / 2) - (highestPackage.bounds.max.y - highestPackage.bounds.min.y) / 2 - verticalSpacing;
        }
        
        // 确保包裹不会太低（太靠近摩托车后座）
        const minY = baseY - motoHeight * 0.5;
        if (packageY > minY) {
            packageY = minY;
        }
        
        // 确保包裹不会太高（超出视野）
        const maxY = baseY - motoHeight * 1.2;
        if (packageY < maxY) {
            packageY = maxY;
        }
        
        // 包裹宽度保持不变
        const packageWidth = fixedPackageWidth;
        
        console.log(`Placing ${packageSizeType} at Y: ${packageY}, base: ${baseY}, height: ${packageHeight}`);
        
        // 创建带有边框的包裹
        const packageBlock = Bodies.rectangle(
            packageX,
            packageY,
            packageWidth,
            packageHeight,
            {
                restitution: 0.2,
                friction: 0.3,
                frictionStatic: 0.5,
                density: 0.01,
                chamfer: { radius: 5 },
                render: {
                    sprite: {
                        texture: 'package.png',
                        xScale: packageWidth / packageImg.width,
                        yScale: packageHeight / packageImg.height
                    },
                    visible: true,
                    lineWidth: 2,
                    strokeStyle: borderColor // 使用与包裹尺寸对应的边框颜色
                },
                label: 'package',
                isOnGround: false,
                originalIndex: packageCount,
                heightMultiplier: heightMultiplier,
                customerName: currentCustomer.name,
                customerRequest: currentRequest.text,
                packageSizeType: packageSizeType,
                borderColor: borderColor,
                // 新增派送相关属性
                deliveryDistance: deliveryDistance,
                deliveryEarning: deliveryEarning,
                distanceTraveled: 0, // 初始化已行驶距离为0
                deliveryStartDistance: distance // 记录接单时的总行驶距离
            }
        );
        
        blocks.push(packageBlock);
        World.add(world, packageBlock);
        packageCount++;
        hasAddedPackage = true;
        console.log(`Added ${packageSizeType} #${packageCount} for ${currentCustomer.name} - Distance: ${deliveryDistance}m, Earning: ${deliveryEarning}元`);
        
        // 移除接受订单的提示
        // showCustomerToast(currentCustomer.name, `${packageSizeType}已接收`, borderColor);
    };
}

// 修改提示框函数以支持颜色
function showCustomerToast(name, message, color = '#2196F3') {
    // 创建一个临时的提示框
    const toast = document.createElement('div');
    toast.className = 'customer-toast order-accepted'; // 添加接单类名
    toast.innerHTML = `<strong>${name}:</strong> ${message}`;
    
    // 不再设置背景色，使用CSS类控制样式
    // 添加到游戏容器
    const container = document.getElementById('canvas-container');
    container.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            container.removeChild(toast);
        }, 500);
    }, 3000);
}

// 设置界面控制
document.addEventListener('DOMContentLoaded', function() {
    const setupScreen = document.getElementById('setup-screen');
    const gameContainer = document.getElementById('game-container');
    const startButton = document.getElementById('start-game');
    
    
    // 开始游戏
    startButton.addEventListener('click', () => {
        setupScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        
        // 重置时间场景索引，确保从第一个场景开始
        timeSceneIndex = 0;
        
        
        initializeGame();
    });

    // 重新开始按钮事件
    document.getElementById('restart-button').addEventListener('click', function() {
        // 隐藏游戏结束界面
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.style.display = 'none';
        
        // 重置结算界面中的动画元素
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            // 重置动画状态
            item.style.animation = 'none';
            item.style.opacity = '0';
            
            // 触发重排
            void item.offsetWidth;
            
            // 恢复动画
            item.style.animation = '';
        });
        
        // 重置总收入元素的动画
        const finalEarnings = document.getElementById('final-earnings');
        if (finalEarnings) {
            finalEarnings.style.animation = 'none';
            void finalEarnings.offsetWidth;
            finalEarnings.style.animation = '';
        }
        
        // 重置星星元素的动画
        const finalStars = document.getElementById('final-stars');
        if (finalStars) {
            finalStars.style.animation = 'none';
            finalStars.style.opacity = '0';
            void finalStars.offsetWidth;
            finalStars.style.animation = '';
        }
        
        // 重置游戏结果文本的动画
        const gameResult = document.getElementById('game-result');
        if (gameResult) {
            gameResult.style.animation = 'none';
            gameResult.style.opacity = '0';
            void gameResult.offsetWidth;
            gameResult.style.animation = '';
        }
        
        // 重置重启按钮的动画
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.style.animation = 'none';
            restartButton.style.opacity = '0';
            void restartButton.offsetWidth;
            restartButton.style.animation = '';
        }
        
        // 重置时间场景索引，确保从下一个场景开始
        // 不重置为0，而是保持当前索引，这样每次重新开始都会轮换场景
        console.log(`重新开始游戏，当前时间场景索引: ${timeSceneIndex}`);
        
        // 重新初始化游戏
        initializeGame();
    });

    // 添加"添加包裹"按钮功能
    const addPackageButton = document.getElementById('add-package');
    addPackageButton.addEventListener('click', () => {
        if (!gameOver && packageCount < 100) { // 最多100个包裹
            addPackage();
        }
    });
});

// 游戏初始化函数
function initializeGame() {
    // 重置游戏状态
    gameStarted = true;
    gameOver = false;
    distance = 0;
    blocks = []; // 确保初始化时重置blocks数组
    starCount = 5; // 重置星星数量
    gameTime = 60; // 重置游戏时间
    isTimerStarted = false; // 重置计时器状态
    totalEarnings = 0; // 重置总收入
    deliveredPackageCount = 0; // 重置成功派送的包裹数量
    droppedPackageCount = 0; // 重置掉落的包裹数量
    packageCount = 0; // 重置包裹总数
    pendingOrderCount = 1; // 重置待处理订单数量
    
    // 重置订单数字显示
    const orderCountElement = document.getElementById('order-count');
    if (orderCountElement) {
        orderCountElement.textContent = pendingOrderCount;
    }
    
    // 清除之前的订单增长计时器
    if (orderIncreaseInterval) {
        clearInterval(orderIncreaseInterval);
    }
    
    // 启动订单数字增长计时器
    startOrderIncreaseTimer();
    
    // 获取游戏容器
    const container = document.getElementById('canvas-container');
    
    // 获取当前时间场景
    const currentScene = timeScenes[timeSceneIndex];
    console.log(`当前时间场景: ${currentScene.name}`);
    
    // 更新下一次的时间场景索引
    timeSceneIndex = (timeSceneIndex + 1) % timeScenes.length;
    
    // 根据时间场景调整游戏容器的滤镜效果
    if (currentScene.name === "白天") {
        container.style.filter = "brightness(1.0) contrast(1.0)";
    } else if (currentScene.name === "黄昏") {
        container.style.filter = "brightness(0.9) contrast(1.1) sepia(0.2)";
    } else {
        container.style.filter = "brightness(0.7) contrast(1.2) saturate(0.8)";
    }
    
    // 如果计时器已存在，清除它
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // 移除可能存在的计时器和星星显示
    const timerDisplay = document.getElementById('timer');
    const starsDisplay = document.getElementById('stars');
    const earningsDisplay = document.getElementById('earnings');
    const distanceDisplay = document.getElementById('distance'); // 添加距离显示元素
    
    if (timerDisplay) {
        timerDisplay.parentNode.removeChild(timerDisplay);
    }
    
    if (starsDisplay) {
        starsDisplay.parentNode.removeChild(starsDisplay);
    }
    
    if (earningsDisplay) {
        earningsDisplay.parentNode.removeChild(earningsDisplay);
    }
    
    // 移除距离显示元素
    if (distanceDisplay) {
        distanceDisplay.parentNode.removeChild(distanceDisplay);
    }
    
    // 移除时间场景指示器
    const timeSceneDisplay = document.getElementById('time-scene');
    if (timeSceneDisplay) {
        timeSceneDisplay.parentNode.removeChild(timeSceneDisplay);
    }
    
    // 移除所有派送进度标签
    document.querySelectorAll('.delivery-progress-label').forEach(label => {
        label.parentNode.removeChild(label);
    });
    
    // 获取游戏容器尺寸
    const gameCanvas = document.getElementById('game-canvas');
    
    // 设置容器尺寸（仅声明一次）
    const containerWidth = container.clientWidth || window.innerWidth * 0.95;
    const containerHeight = container.clientHeight || window.innerHeight * 0.8;
    
    // 调整游戏容器尺寸
    gameCanvas.width = containerWidth;
    gameCanvas.height = containerHeight;

    // 创建物理引擎
    const engine = Engine.create({
        // 调整重力以使游戏更符合直觉
        gravity: { x: 0, y: 1, scale: 0.001 }
    });
    world = engine.world;

    // 创建渲染器
    const render = Render.create({
        element: container,
        engine: engine,
        canvas: document.getElementById('game-canvas'),
        options: {
            width: containerWidth,
            height: containerHeight,
            wireframes: false,
            background: '#f0f0f0',
            showAngleIndicator: false
        }
    });

    // 启动渲染器
    Render.run(render);

    // 定义积木的颜色
    const blockColors = [
        '#1A535C',  // 深绿色
        '#6A0572',  // 紫色
        '#FFD166',  // 黄色
        '#4ECDC4',  // 青色
        '#FF6B6B'   // 红色
    ];

    // 加载摩托车图片并获取其原始宽高比
    const motoImg = new Image();
    motoImg.src = 'moto.png';
    
    // 摩托车物理尺寸（保持宽高比）
    motoWidth = fixedMotoWidth;
    motoHeight = fixedMotoHeight;
    motoY = containerHeight * 0.8 - 15; // 稍微抬高，使其悬浮
    
    // 记录摩托车的初始位置
    initialMotoX = containerWidth * 0.4;
    
    // 积木尺寸和位置计算 - 调整为更适合后车座的尺寸
    const blockWidth = containerWidth * 0.08;
    const blockHeight = containerHeight * 0.04;
    const blockSpacing = 1; // 积木间距减小，使积木紧密堆叠
    
    // 创建地面（不会移动的部分）
    const groundOptions = { 
        isStatic: true,
        restitution: 0.2,
        friction: 0.5,
        render: { visible: false },
        label: 'ground'  // 添加标签以便识别
    };
    
    const ground = Bodies.rectangle(
        containerWidth / 2, 
        containerHeight - 10, 
        containerWidth * 3, 
        20, 
        groundOptions
    );
    
    // 创建摩托车碰撞体
    const motoCollider = Bodies.rectangle(
        initialMotoX, 
        motoY, 
        motoWidth, 
        motoHeight / 1, // 碰撞体高度
        {
            friction: 0.3,         // 增加摩擦力，使积木更容易停留在摩托车上
            frictionStatic: 0.1,    // 增加静摩擦力，使积木更容易停留在摩托车上
            restitution: 0.1,
            density: 0.5,            // 保持较高密度，防止变形
            isStatic: true,          // 设置为静态物体，确保不会移动
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF
            },
            render: { 
                visible: false, // 设为不可见，不再需要调试
                fillStyle: 'rgba(255, 0, 0, 0.3)' // 半透明红色，用于调试
            },
            label: 'motoCollider'
        }
    );
    
    // 创建摩托车视觉元素 - 只用于显示，不参与碰撞
    const motoVisual = Bodies.rectangle(
        initialMotoX, 
        motoY - motoHeight / 4, // 视觉元素位置上移，使碰撞体位于图片下半部分
        motoWidth, 
        motoHeight,
        {
            isSensor: true, // 设为传感器，不参与物理碰撞
            isStatic: true,
            collisionFilter: {
                category: 0x0002,
                mask: 0 // 不与任何物体碰撞
            },
            render: { 
                sprite: {
                    texture: 'moto.png',
                    xScale: 1, // 初始值，将在图片加载后更新
                    yScale: 1  // 初始值，将在图片加载后更新
                }
            },
            label: 'motoVisual'
        }
    );
    
    // 创建积木 - 减轻重量并放置在后车座上
    
    // 创建积木函数 - 完全重写为添加单个包裹的方法
    function createBlocks() {
        blocks.length = 0; // 初始时没有包裹
        return blocks;
    }
    
    // 图片加载完成后调整尺寸
    motoImg.onload = function() {
        // 获取图片的真实宽高比
        const imgRatio = motoImg.width / motoImg.height;
        // 根据图片真实宽高比调整摩托车高度
        motoHeight = motoWidth / imgRatio;
        
        // 更新摩托车视觉元素的渲染属性
        motoVisual.render.sprite.xScale = motoWidth / motoImg.width;
        motoVisual.render.sprite.yScale = motoHeight / motoImg.height;
        
        // 调整碰撞体的尺寸和位置
        Body.scale(motoCollider, 1, motoHeight / (motoWidth / 1.5) / 2);
        
        // 调整视觉元素的位置，使其与碰撞体对齐
        Body.setPosition(motoVisual, {
            x: initialMotoX,
            y: motoY - motoHeight / 4 // 视觉元素上移，使碰撞体位于图片下半部分
        });
        
        // 打印摩托车位置信息，用于调试
        console.log(`Motorcycle collider position: x=${motoCollider.position.x}, y=${motoCollider.position.y}`);
        console.log(`Motorcycle visual position: x=${motoVisual.position.x}, y=${motoVisual.position.y}`);
        console.log(`Motorcycle dimensions: width=${motoWidth}, height=${motoHeight}`);
        
        // 创建积木 - 在摩托车加载完成后
        setTimeout(function() {
            createBlocks();
            console.log("Game initialized with 0 packages");
        }, 500); // 添加延迟，确保摩托车完全加载
    };
    
    // 根据摩托车尺寸调整积木位置的函数
    function repositionBlocks() {
        // 移除旧的积木
        blocks.forEach(block => {
            World.remove(world, block);
        });
        
        // 创建新的积木
        createBlocks();
    }
    
    // 添加悬浮效果的视觉元素 - 确保与地面完全一致
    const hoverEffect = Bodies.rectangle(
        initialMotoX,
        containerHeight - 10, // 与地面位置完全一致
        motoWidth * 0.8,
        20, // 与地面高度完全一致 (20)
        {
            isSensor: true,
            isStatic: true,  // 设置为静态物体，确保不会移动
            collisionFilter: {
                category: 0x0008,
                mask: 0
            },
            render: {
                visible: false, // 隐藏悬浮体的可见性
                fillStyle: 'rgba(135, 206, 250, 0.5)',
                strokeStyle: 'rgba(135, 206, 250, 0.8)',
                lineWidth: 1
            },
            label: 'hoverEffect'
        }
    );

    // 创建悬浮车辆组合 - 不包含积木
    const vehicle = Composite.create({
        bodies: [motoCollider, motoVisual, hoverEffect],
        constraints: []  // 移除约束，因为车辆现在是静态的
    });
    
    // 添加车辆到世界
    World.add(world, [vehicle, ground]);
    
    // 清除现有的背景图层
    Object.keys(backgroundLayers).forEach(layerName => {
        if (backgroundLayers[layerName] && backgroundLayers[layerName].length > 0) {
            backgroundLayers[layerName].forEach(bg => {
                World.remove(world, bg);
            });
            backgroundLayers[layerName] = [];
        }
    });
    
    // 创建无限滚动背景
    const bgFar = new Image();
    const bgMiddle = new Image();
    const bgNear = new Image();
    
    // 根据当前时间场景设置背景图片
    bgFar.src = currentScene.bg;
    bgMiddle.src = currentScene.building;
    bgNear.src = currentScene.road;
    
    console.log(`加载背景图片: ${bgFar.src}, ${bgMiddle.src}, ${bgNear.src}`);
    
    // 当所有背景图片都加载完成后创建背景层
    Promise.all([
        new Promise(resolve => {
            bgFar.onload = resolve;
            // 如果图片已经加载完成，手动触发onload事件
            if (bgFar.complete) resolve();
        }),
        new Promise(resolve => {
            bgMiddle.onload = resolve;
            if (bgMiddle.complete) resolve();
        }),
        new Promise(resolve => {
            bgNear.onload = resolve;
            if (bgNear.complete) resolve();
        })
    ]).then(() => {
        // 为每一层计算合适的缩放比例
        const farScale = containerHeight / bgFar.height;
        const middleScale = containerHeight / bgMiddle.height;
        const nearScale = containerHeight / bgNear.height;
        
        // 创建三个图层
        createBackgroundLayer(bgFar, farScale, 0x0010, 'far');
        createBackgroundLayer(bgMiddle, middleScale, 0x0020, 'middle');
        createBackgroundLayer(bgNear, nearScale, 0x0030, 'near');
        
        console.log(`背景图片加载完成: ${currentScene.name}`);
    }).catch(error => {
        console.error(`背景图片加载失败: ${error}`);
    });
    
    // 更新背景图片位置的函数
    function updateBackgroundPositions() {
        // 更新远景层 - 速度是近景的2%
        updateLayerPosition('far', speed * 0.01);
        
        // 更新中景层 - 速度是近景的40%
        updateLayerPosition('middle', speed * 0.2);
        
        // 更新近景层 - 全速
        updateLayerPosition('near', speed * 0.5);
    }
    
    // 更新单个图层位置的函数
    function updateLayerPosition(layerName, layerSpeed) {
        const layer = backgroundLayers[layerName];
        if (layer.length === 0) return;
        
        // 获取背景图片的宽度（已缩放）
        const firstBg = layer[0];
        const bgWidth = firstBg.bounds.max.x - firstBg.bounds.min.x;
        
        // 移动该层的所有背景图片
        layer.forEach(bg => {
            // 向左移动背景图片
            Body.setPosition(bg, {
                x: bg.position.x - layerSpeed,
                y: bg.position.y
            });
            
            // 如果图片完全移出屏幕左侧，将其移到最右侧
            if (bg.position.x < -bgWidth/2) {
                // 找到最右侧的背景图片
                let rightmostX = -Infinity;
                layer.forEach(otherBg => {
                    if (otherBg.position.x > rightmostX) {
                        rightmostX = otherBg.position.x;
                    }
                });
                
                // 将当前图片放到最右侧图片的右边，减去1像素以创建重叠
                Body.setPosition(bg, {
                    x: rightmostX + bgWidth - 1,
                    y: bg.position.y
                });
            }
        });
    }
    
    // 掉落的积木数组
    const fallenBlocks = [];
    
    // 控制变量
    let speed = 0;
    const maxSpeed = 50;
    const acceleration = 0.2;
    const deceleration = 0.5;
    const friction = 0.02;
    let isAccelerating = false;
    let isBraking = false;
    
    // 创建控制按钮
    const accelerateBtn = document.getElementById('accelerate');
    const brakeBtn = document.getElementById('brake');
    
    // 按键控制
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowRight') {
            isAccelerating = true;
        } else if (event.key === 'ArrowLeft') {
            isBraking = true;
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (event.key === 'ArrowRight') {
            isAccelerating = false;
        } else if (event.key === 'ArrowLeft') {
            isBraking = false;
        }
    });
    
    // 触摸按钮控制
    if (accelerateBtn) {
        accelerateBtn.addEventListener('mousedown', function() { 
            isAccelerating = true; 
            if (!gameStarted) gameStarted = true;
        });
        accelerateBtn.addEventListener('mouseup', function() { isAccelerating = false; });
        accelerateBtn.addEventListener('touchstart', function() { 
            isAccelerating = true; 
            if (!gameStarted) gameStarted = true;
        });
        accelerateBtn.addEventListener('touchend', function() { isAccelerating = false; });
    }
    
    if (brakeBtn) {
        brakeBtn.addEventListener('mousedown', function() { isBraking = true; });
        brakeBtn.addEventListener('mouseup', function() { isBraking = false; });
        brakeBtn.addEventListener('touchstart', function() { isBraking = true; });
        brakeBtn.addEventListener('touchend', function() { isBraking = false; });
    }
    
    // 更新速度计
    function updateSpeedometer() {
        const speedometer = document.getElementById('speed');
        if (speedometer) {
            const speedPercentage = Math.floor((speed / maxSpeed) * 100);
            speedometer.textContent = `速度: ${speedPercentage}%`;
            
            // 根据速度更改颜色
            if (speedPercentage < 30) {
                speedometer.style.color = '#2ecc71'; // 绿色
            } else if (speedPercentage < 70) {
                speedometer.style.color = '#f39c12'; // 橙色
            } else {
                speedometer.style.color = '#e74c3c'; // 红色
            }
        }
    }
    
    // 检测积木是否掉落到地面
    function checkFallenBlocks() {
        // 遍历所有积木
        for (let i = 0; i < blocks.length; i++) {
            const packageBlock = blocks[i];
            
            // 如果包裹已经被标记为在地面上，跳过
            if (packageBlock.isOnGround) continue;
            
            // 检查包裹是否接触地面
            const collisions = Query.collides(packageBlock, [ground]);
            
            // 如果包裹与地面碰撞，且包裹的y位置接近地面
            if (collisions.length > 0 && 
                packageBlock.position.y > containerHeight - packageBlock.bounds.max.y - packageBlock.bounds.min.y - 30) {
                
                // 标记包裹为在地面上
                packageBlock.isOnGround = true;
                
                // 移除派送进度标签
                removePackageDeliveryProgressLabel(packageBlock);
                
                // 增加掉落包裹计数
                droppedPackageCount++;
                
                // 添加到掉落积木数组
                fallenBlocks.push(packageBlock);
                
                // 从blocks数组中移除
                blocks.splice(i, 1);
                i--; // 调整索引
                
                // 掉落包裹时减少一颗星
                if (starCount > 0) {
                    starCount--;
                    updateStarsDisplay();
                    
                    // 显示掉落提示
                    showPackageDropToast(packageBlock);
                    
                    // 如果星星为0，结束游戏
                    if (starCount === 0) {
                        endGame("评价崩盘，还是换份别的工作吧！");
                    }
                }
                
                console.log(`Package fell to the ground at position: x=${packageBlock.position.x}, y=${packageBlock.position.y}`);
            }
        }
    }
    
    // 显示包裹掉落提示
    function showPackageDropToast(packageBlock) {
        const packageSizeType = packageBlock.packageSizeType || "包裹";
        
        // 创建一个临时的提示框
        const toast = document.createElement('div');
        toast.className = 'customer-toast order-warning'; // 添加警告类名
        toast.innerHTML = `<strong>警告:</strong> ${packageSizeType}掉落！失去一颗星星！`;
        
        // 添加到游戏容器
        const container = document.getElementById('canvas-container');
        container.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                container.removeChild(toast);
            }, 500);
        }, 3000);
    }
    
    // 检查是否有积木阻挡摩托车
    function checkBlockingBlocks() {
        // 检查每个掉落的积木
        for (let i = 0; i < fallenBlocks.length; i++) {
            const packageBlock = fallenBlocks[i];
            
            // 如果积木在摩托车前方且高度合适，可能会阻挡摩托车
            if (packageBlock.position.x > motoCollider.position.x && 
                packageBlock.position.x < motoCollider.position.x + motoWidth * 1.5 &&
                packageBlock.position.y > motoY - motoHeight * 2 &&
                packageBlock.position.y < motoY + motoHeight * 2) {
                
                // 有积木阻挡，返回true
                return true;
            }
        }
        
        // 没有积木阻挡
        return false;
    }
    
    // 更新悬浮效果
    function updateHoverEffect() {
        // 根据速度调整悬浮效果的透明度
        const opacity = 0.3 + (speed / maxSpeed) * 0.5;
        
        // 更新悬浮效果的渲染属性（即使不可见，也保留这些属性以便将来可能需要显示）
        hoverEffect.render.fillStyle = `rgba(135, 206, 250, ${opacity})`;
        hoverEffect.render.strokeStyle = `rgba(135, 206, 250, ${opacity + 0.3})`;
        
        // 根据速度调整悬浮效果的宽度
        const newWidth = motoWidth * (0.8 + (speed / maxSpeed) * 0.4);
        
        // 重新创建悬浮效果，而不是使用scale方法
        Body.setVertices(hoverEffect, Bodies.rectangle(
            initialMotoX,
            containerHeight - 10, // 与地面位置完全一致
            newWidth,
            20, // 与地面高度完全一致 (20)
            { isStatic: true }
        ).vertices);
    }
    
    // 添加鼠标控制（用于拖动积木）
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.1,
            damping: 0.1,
            render: {
                visible: true
            }
        }
    });
    
    World.add(world, mouseConstraint);
    render.mouse = mouse;
    
    // 添加触控板特定事件处理
    const canvas = render.canvas;
    
    // 增强触控板支持
    canvas.addEventListener('mousedown', function(event) {
        // 强制更新鼠标位置
        mouse.position.x = event.offsetX;
        mouse.position.y = event.offsetY;
        mouse.mousedown.x = event.offsetX;
        mouse.mousedown.y = event.offsetY;
    });
    
    canvas.addEventListener('mousemove', function(event) {
        // 确保鼠标位置准确更新
        mouse.position.x = event.offsetX;
        mouse.position.y = event.offsetY;
    });
    
    // 添加触摸支持
    canvas.addEventListener('touchstart', function(event) {
        if (event.target !== accelerateBtn && event.target !== brakeBtn) {
            event.preventDefault();
            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            mouse.position.x = x;
            mouse.position.y = y;
            mouse.mousedown.x = x;
            mouse.mousedown.y = y;
            mouse.mouseup.x = x;
            mouse.mouseup.y = y;
            mouse.button = 0;
            
            // 模拟点击事件
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    });
    
    canvas.addEventListener('touchmove', function(event) {
        if (event.target !== accelerateBtn && event.target !== brakeBtn) {
            event.preventDefault();
            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            mouse.position.x = x;
            mouse.position.y = y;
            
            // 模拟移动事件
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    });
    
    canvas.addEventListener('touchend', function(event) {
        if (event.target !== accelerateBtn && event.target !== brakeBtn) {
            event.preventDefault();
            mouse.button = -1;
            
            // 模拟抬起事件
            const mouseEvent = new MouseEvent('mouseup');
            canvas.dispatchEvent(mouseEvent);
        }
    });
    
    // 更新距离显示
    function updateDistanceDisplay() {
        const distanceDisplay = document.getElementById('distance');
        if (distanceDisplay) {
            distanceDisplay.textContent = `距离: ${Math.floor(distance)} 米`;
        }
    }
    
    // 检测游戏结束条件
    function checkGameOver() {
        if (gameOver) return true;
        
        // 只有在游戏已开始后才检查结束条件
        if (!gameStarted) return false;
        
        // 情况1: 星星数量为0
        if (starCount === 0) {
            endGame("评价崩盘，还是换份别的工作吧！");
            return true;
        }
        
        // 情况2: 游戏时间结束
        if (isTimerStarted && gameTime <= 0) {
            endGame("该回家吃饭了！");
            return true;
        }
        
        return false;
    }
    
    // 游戏结束函数
    function endGame(message) {
        gameOver = true;
        
        // 清除计时器
        if (gameTimer) {
            clearInterval(gameTimer);
        }
        
        // 清除订单增长计时器
        if (orderIncreaseInterval) {
            clearInterval(orderIncreaseInterval);
        }
        
        // 显示游戏结束界面
        const gameOverScreen = document.getElementById('game-over-screen');
        const scoreElement = document.getElementById('score');
        const resultElement = document.getElementById('game-result');
        const distanceElement = document.getElementById('final-distance');
        const timeElement = document.getElementById('final-time');
        const starsElement = document.getElementById('final-stars');
        const earningsElement = document.getElementById('final-earnings');
        const deliveredCountElement = document.getElementById('delivered-count');
        const droppedCountElement = document.getElementById('dropped-count');
        
        if (gameOverScreen && scoreElement && resultElement && distanceElement) {
            // 重置所有动画元素的状态
            const statItems = document.querySelectorAll('.stat-item');
            statItems.forEach((item, index) => {
                item.style.animation = 'none';
                item.style.opacity = '0';
                void item.offsetWidth;
                item.style.animation = `slideRight 0.5s ease-out forwards ${0.6 + index * 0.2}s`;
            });
            
            // 重置游戏结果文本的动画
            resultElement.style.animation = 'none';
            resultElement.style.opacity = '0';
            void resultElement.offsetWidth;
            resultElement.style.animation = 'fadeIn 0.8s ease-out forwards 0.3s';
            
            // 重置星星元素的动画
            if (starsElement) {
                starsElement.style.animation = 'none';
                starsElement.style.opacity = '0';
                void starsElement.offsetWidth;
                starsElement.style.animation = 'starPop 1.5s ease-out forwards 1.4s';
            }
            
            // 重置总收入元素的动画
            if (earningsElement) {
                earningsElement.style.animation = 'none';
                void earningsElement.offsetWidth;
                earningsElement.style.animation = 'earningsGlow 2s infinite alternate, countUp 1.5s ease-out forwards 1.6s, earningsScale 4s infinite';
            }
            
            // 重置重启按钮的动画
            const restartButton = document.getElementById('restart-button');
            if (restartButton) {
                restartButton.style.animation = 'none';
                restartButton.style.opacity = '0';
                void restartButton.offsetWidth;
                restartButton.style.animation = 'fadeIn 0.8s ease-out forwards 1.8s';
            }
            
            // 设置游戏结束原因
            resultElement.textContent = message;
            
            // 设置得分（成功派送的包裹数量，而不是剩余包裹）
            scoreElement.textContent = deliveredPackageCount;
            
            // 设置包裹统计信息
            if (deliveredCountElement) {
                deliveredCountElement.textContent = deliveredPackageCount;
            }
            
            if (droppedCountElement) {
                droppedCountElement.textContent = droppedPackageCount;
            }
            
            // 设置行驶距离
            distanceElement.textContent = Math.floor(distance);
            
            // 设置用时（60秒 - 剩余时间）
            const usedTime = isTimerStarted ? (60 - gameTime) : 0;
            timeElement.textContent = usedTime;
            
            // 设置星星评级
            let starsText = '';
            for (let i = 0; i < starCount; i++) {
                starsText += '★';
            }
            for (let i = starCount; i < 5; i++) {
                starsText += '☆';
            }
            starsElement.textContent = starsText;
            
            // 设置总收入
            if (earningsElement) {
                earningsElement.textContent = totalEarnings;
            }
            
            // 显示游戏结束界面
            gameOverScreen.style.display = 'block';
        }
    }
    
    // 使用自定义引擎更新函数，以便我们可以控制背景移动
    function customUpdate() {
        // 如果游戏结束，不再更新
        if (checkGameOver()) {
            return;
        }
        
        // 记录上一帧的速度，用于计算速度变化
        const prevSpeed = speed;
        
        // 更新速度
        if (isAccelerating && speed < maxSpeed) {
            speed += acceleration;
        } else if (isBraking && speed > 0) {
            speed -= deceleration;
        } else if (speed > 0) {
            speed -= friction; // 自然减速
        }
        
        // 确保速度不为负
        speed = Math.max(0, speed);
        
        // 计算速度变化量
        const deltaSpeed = speed - prevSpeed;
        
        // 更新行驶距离 (速度 * 时间)
        if (gameStarted && !gameOver) {
            const distanceIncrement = speed * 0.02; // 假设每帧是1/60秒，转换为米
            distance += distanceIncrement;
            updateDistanceDisplay();
            
            // 检查每个包裹的派送状态
            checkPackageDelivery(distanceIncrement);
        }
        
        // 检查是否有积木掉落到地面
        checkFallenBlocks();
        
        // 检查是否有积木阻挡摩托车
        const isBlocked = checkBlockingBlocks();
        
        // 更新悬浮效果
        updateHoverEffect();
        
        // 更新背景图片位置
        updateBackgroundPositions();
        
        // 当速度变化较大时，给积木施加一个小的力，帮助它们滑落
        if (Math.abs(deltaSpeed) > 0.2) {
            blocks.forEach(packageBlock => {
                if (!packageBlock.isOnGround) {
                    // 完全重写力的应用逻辑
                    // 当加速时（deltaSpeed > 0），包裹应该向后移动
                    // 当减速时（deltaSpeed < 0），包裹应该向前移动
                    const forceX = -deltaSpeed * 0.001; // 减小力的大小，确保不会过度移动
                    
                    // 施加力
                    Body.applyForce(packageBlock, packageBlock.position, {
                        x: forceX,
                        y: 0
                    });
                    
                    // 直接调整包裹的速度，确保相对运动正确
                    const currentVelocity = packageBlock.velocity;
                    Body.setVelocity(packageBlock, {
                        x: currentVelocity.x - deltaSpeed * 0.5, // 直接减去速度变化的一半
                        y: currentVelocity.y
                    });
                    
                    console.log(`Applied force to package: ${forceX}, adjusted velocity: ${currentVelocity.x - deltaSpeed * 0.5}`);
                }
            });
        }
        
        // 更新掉落的积木位置 - 让它们相对于车辆向后移动
        for (let i = 0; i < fallenBlocks.length; i++) {
            const packageBlock = fallenBlocks[i];
            
            // 向相反方向移动，模拟车辆前进
            Body.setPosition(packageBlock, {
                x: packageBlock.position.x - speed,
                y: packageBlock.position.y
            });
            
            // 如果积木移出屏幕太远，从世界中移除它
            if (packageBlock.position.x < -containerWidth) {
                World.remove(world, packageBlock);
                fallenBlocks.splice(i, 1);
                i--; // 调整索引
            }
        }
        
        // 更新速度计
        updateSpeedometer();
        
        // 运行引擎更新
        Engine.update(engine, 1000 / 60);
        
        // 继续循环
        requestAnimationFrame(customUpdate);
    }
    
    // 检查包裹派送状态
    function checkPackageDelivery(distanceIncrement) {
        // 为每个包裹累加行驶距离
        for (let i = 0; i < blocks.length; i++) {
            const packageBlock = blocks[i];
            
            // 累加行驶距离
            packageBlock.distanceTraveled += distanceIncrement;
            
            // 更新包裹派送进度显示
            updatePackageDeliveryProgress(packageBlock);
            
            // 检查是否达到派送距离要求
            if (packageBlock.distanceTraveled >= packageBlock.deliveryDistance) {
                console.log(`Package delivered: ${packageBlock.packageSizeType} - Distance: ${Math.floor(packageBlock.distanceTraveled)}/${packageBlock.deliveryDistance}m, Earning: ${packageBlock.deliveryEarning}元`);
                
                // 累加收入
                totalEarnings += packageBlock.deliveryEarning;
                
                // 更新收入显示
                updateEarningsDisplay();
                
                // 增加成功派送的包裹计数
                deliveredPackageCount++;
                
                // 移除显示派送成功提示的代码
                // showDeliverySuccessToast(packageBlock);
                
                // 移除派送进度标签
                removePackageDeliveryProgressLabel(packageBlock);
                
                // 从物理世界中移除包裹
                World.remove(world, packageBlock);
                
                // 从blocks数组中移除
                blocks.splice(i, 1);
                i--; // 调整索引
            }
        }
    }
    
    // 更新包裹派送进度显示
    function updatePackageDeliveryProgress(packageBlock) {
        // 如果包裹没有进度标签，创建一个
        if (!packageBlock.deliveryProgressLabel) {
            packageBlock.deliveryProgressLabel = document.createElement('div');
            packageBlock.deliveryProgressLabel.className = 'delivery-progress-label';
            packageBlock.deliveryProgressLabel.style.position = 'absolute';
            packageBlock.deliveryProgressLabel.style.fontSize = '12px';
            packageBlock.deliveryProgressLabel.style.fontWeight = 'bold';
            packageBlock.deliveryProgressLabel.style.color = 'white';
            packageBlock.deliveryProgressLabel.style.backgroundColor = 'rgba(33, 150, 243, 0.7)';
            packageBlock.deliveryProgressLabel.style.padding = '2px 5px';
            packageBlock.deliveryProgressLabel.style.borderRadius = '3px';
            packageBlock.deliveryProgressLabel.style.textAlign = 'center';
            packageBlock.deliveryProgressLabel.style.zIndex = '10';
            packageBlock.deliveryProgressLabel.style.pointerEvents = 'none'; // 禁止鼠标交互
            packageBlock.deliveryProgressLabel.style.textShadow = '1px 1px 1px rgba(0,0,0,0.5)';
            document.getElementById('canvas-container').appendChild(packageBlock.deliveryProgressLabel);
        }

        // 计算完成百分比
        const percentage = Math.min(100, Math.floor((packageBlock.distanceTraveled / packageBlock.deliveryDistance) * 100));
        packageBlock.deliveryProgressLabel.textContent = `${percentage}%`;
        
        // 根据完成度设置颜色
        if (percentage < 30) {
            packageBlock.deliveryProgressLabel.style.backgroundColor = 'rgba(233, 30, 99, 0.7)'; // 粉红色
        } else if (percentage < 70) {
            packageBlock.deliveryProgressLabel.style.backgroundColor = 'rgba(255, 152, 0, 0.7)'; // 橙色
        } else {
            packageBlock.deliveryProgressLabel.style.backgroundColor = 'rgba(76, 175, 80, 0.7)'; // 绿色
        }
        
        // 更新标签位置，放在包裹上方
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const x = packageBlock.position.x * (rect.width / canvas.width);
        const y = packageBlock.position.y * (rect.height / canvas.height) - 30; // 上方偏移
        
        packageBlock.deliveryProgressLabel.style.left = `${x - packageBlock.deliveryProgressLabel.offsetWidth / 2}px`;
        packageBlock.deliveryProgressLabel.style.top = `${y - packageBlock.deliveryProgressLabel.offsetHeight / 2}px`;
    }

    // 在移除包裹时清除进度标签
    function removePackageDeliveryProgressLabel(packageBlock) {
        if (packageBlock.deliveryProgressLabel) {
            packageBlock.deliveryProgressLabel.parentNode.removeChild(packageBlock.deliveryProgressLabel);
            packageBlock.deliveryProgressLabel = null;
        }
    }

    // 显示派送成功提示
    function showDeliverySuccessToast(packageBlock) {
        // 移除派送进度标签
        removePackageDeliveryProgressLabel(packageBlock);
        
        const packageSizeType = packageBlock.packageSizeType || "包裹";
        const earning = packageBlock.deliveryEarning;
        
        // 创建一个临时的提示框
        const toast = document.createElement('div');
        toast.className = 'customer-toast order-completed'; // 添加完成订单类名
        toast.innerHTML = `<strong>派送成功:</strong> ${packageSizeType}已送达！获得 ${earning}元`;
        
        // 添加到游戏容器
        const container = document.getElementById('canvas-container');
        container.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                container.removeChild(toast);
            }, 500);
        }, 3000);
    }
    
    // 开始自定义更新循环
    customUpdate();
    
    // 添加响应式调整
    window.addEventListener('resize', function() {
        // 获取新的容器尺寸
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        // 更新渲染器尺寸
        render.options.width = newWidth;
        render.options.height = newHeight;
        render.canvas.width = newWidth;
        render.canvas.height = newHeight;
        
        // 重新设置地面位置和尺寸
        Body.setPosition(ground, { x: newWidth / 2, y: newHeight - 10 });
        Body.setVertices(ground, Bodies.rectangle(newWidth / 2, newHeight - 10, newWidth * 3, 20).vertices);
    });
}

// 添加游戏计时器功能
function startGameTimer() {
    // 创建计时器显示
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer';
    timerDisplay.className = 'remaining-time'; // 添加类名
    timerDisplay.textContent = `${gameTime}`;
    document.getElementById('canvas-container').appendChild(timerDisplay);
    
    // 添加星级显示
    const starsDisplay = document.createElement('div');
    starsDisplay.id = 'stars';
    starsDisplay.className = 'stars'; // 添加类名
    updateStarsDisplay(starsDisplay);
    document.getElementById('canvas-container').appendChild(starsDisplay);
    
    // 添加收入显示
    const earningsDisplay = document.createElement('div');
    earningsDisplay.id = 'earnings';
    earningsDisplay.className = 'income'; // 添加类名
    earningsDisplay.textContent = `收入: ${totalEarnings}元`;
    document.getElementById('canvas-container').appendChild(earningsDisplay);
    
    // 添加距离显示（移动到这里创建）
    const distanceDisplay = document.createElement('div');
    distanceDisplay.id = 'distance';
    distanceDisplay.className = 'distance'; // 添加类名
    distanceDisplay.textContent = `距离: ${Math.floor(distance)} 米`;
    document.getElementById('canvas-container').appendChild(distanceDisplay);
    
    // 添加时间场景指示器（已隐藏）
    const timeSceneDisplay = document.createElement('div');
    timeSceneDisplay.id = 'time-scene';
    timeSceneDisplay.className = 'time'; // 添加类名
    
    // 获取当前时间场景（因为timeSceneIndex已经被更新为下一个场景，所以需要减1）
    const currentSceneIndex = (timeSceneIndex + timeScenes.length - 1) % timeScenes.length;
    const currentScene = timeScenes[currentSceneIndex];
    
    if (currentScene.name === "白天") {
        timeSceneDisplay.innerHTML = '☀️ 白天';
    } else if (currentScene.name === "黄昏") {
        timeSceneDisplay.innerHTML = '🌆 黄昏';
    } else {
        timeSceneDisplay.innerHTML = '🌙 夜晚';
    }
    
    document.getElementById('canvas-container').appendChild(timeSceneDisplay);
    
    // 启动计时器
    gameTimer = setInterval(() => {
        gameTime--;
        updateTimerDisplay();
        
        if (gameTime <= 0) {
            endGame("该回家吃饭了！");
            clearInterval(gameTimer);
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) {
        timerDisplay.textContent = `${gameTime}`;
        
        // 时间少于10秒时添加紧急样式
        if (gameTime <= 10) {
            timerDisplay.classList.add('urgent');
        } else {
            timerDisplay.classList.remove('urgent');
        }
    }
}

// 更新星级显示
function updateStarsDisplay(displayElement = null) {
    const starsDisplay = displayElement || document.getElementById('stars');
    if (starsDisplay) {
        let starsText = '';
        for (let i = 0; i < starCount; i++) {
            starsText += '★';
        }
        for (let i = starCount; i < 5; i++) {
            starsText += '☆';
        }
        starsDisplay.textContent = starsText;
    }
}

// 更新收入显示
function updateEarningsDisplay() {
    const earningsDisplay = document.getElementById('earnings');
    if (earningsDisplay) {
        earningsDisplay.textContent = `收入: ${totalEarnings}元`;
    }
}

// 更新距离显示
function updateDistanceDisplay() {
    const distanceDisplay = document.getElementById('distance');
    if (distanceDisplay) {
        distanceDisplay.textContent = `距离: ${Math.floor(distance)} 米`;
    }
}

// 背景图片数组 - 分为三层
const backgroundLayers = {
    far: [],      // 远景层 - 最慢
    middle: [],   // 中景层 - 中等速度
    near: []      // 近景层 - 最快
};

// 创建背景图层的函数
function createBackgroundLayer(image, scale, category, layerName) {
    // 获取游戏容器尺寸
    const container = document.getElementById('canvas-container');
    const containerWidth = container.clientWidth || window.innerWidth * 0.95;
    const containerHeight = container.clientHeight || window.innerHeight * 0.8;
    
    const bgWidth = image.width;
    const bgHeight = image.height;
    const scaledWidth = bgWidth * scale;
    const numImages = Math.ceil(containerWidth / scaledWidth) + 1;
    for (let i = 0; i < numImages; i++) {
        const bgSprite = Bodies.rectangle(
            i * (scaledWidth - 1),
            containerHeight / 2,
            scaledWidth + 2,
            containerHeight,
            {
                isStatic: true,
                isSensor: true,
                collisionFilter: {
                    category: category,
                    mask: 0
                },
                render: {
                    sprite: {
                        texture: image.src,
                        xScale: (scale * (scaledWidth + 2)) / scaledWidth,
                        yScale: scale
                    }
                },
                label: `background_${layerName}`
            }
        );
        backgroundLayers[layerName].push(bgSprite);
        World.add(world, bgSprite);
    }
}

// 更新背景图片素材的函数
function updateBackgroundImages(forceUpdate = false, scene = null) {
    // 如果没有指定场景，使用当前场景
    const currentScene = scene || timeScenes[(timeSceneIndex + timeScenes.length - 1) % timeScenes.length];
    
    // 如果不是强制更新，直接返回
    if (!forceUpdate) return;
    
    console.log(`更新背景图片素材为: ${currentScene.name}`);
    
    // 移除所有现有的背景图层
    Object.keys(backgroundLayers).forEach(layerName => {
        backgroundLayers[layerName].forEach(bg => {
            World.remove(world, bg);
        });
        backgroundLayers[layerName] = [];
    });
    
    // 创建新的背景图片
    const bgFar = new Image();
    const bgMiddle = new Image();
    const bgNear = new Image();
    
    // 设置新的背景图片路径
    bgFar.src = currentScene.bg;
    bgMiddle.src = currentScene.building;
    bgNear.src = currentScene.road;
    
    console.log(`加载新背景图片: ${bgFar.src}, ${bgMiddle.src}, ${bgNear.src}`);
    
    // 获取游戏容器尺寸
    const container = document.getElementById('canvas-container');
    const containerWidth = container.clientWidth || window.innerWidth * 0.95;
    const containerHeight = container.clientHeight || window.innerHeight * 0.8;
    
    // 当所有背景图片都加载完成后创建背景层
    Promise.all([
        new Promise(resolve => {
            bgFar.onload = resolve;
            // 如果图片已经加载完成，手动触发onload事件
            if (bgFar.complete) resolve();
        }),
        new Promise(resolve => {
            bgMiddle.onload = resolve;
            if (bgMiddle.complete) resolve();
        }),
        new Promise(resolve => {
            bgNear.onload = resolve;
            if (bgNear.complete) resolve();
        })
    ]).then(() => {
        // 为每一层计算合适的缩放比例
        const farScale = containerHeight / bgFar.height;
        const middleScale = containerHeight / bgMiddle.height;
        const nearScale = containerHeight / bgNear.height;
        
        // 创建三个图层
        createBackgroundLayer(bgFar, farScale, 0x0010, 'far');
        createBackgroundLayer(bgMiddle, middleScale, 0x0020, 'middle');
        createBackgroundLayer(bgNear, nearScale, 0x0030, 'near');
        
        console.log(`背景图片素材更新完成: ${currentScene.name}`);
    }).catch(error => {
        console.error(`背景图片加载失败: ${error}`);
    });
}

// 启动订单数字增长计时器
function startOrderIncreaseTimer() {
    // 随机间隔时间（2-5秒）增加订单数量
    orderIncreaseInterval = setInterval(() => {
        if (!gameOver) {
            // 增加订单数量
            increaseOrderCount();
        } else {
            // 游戏结束时清除计时器
            clearInterval(orderIncreaseInterval);
        }
    }, Math.random() * 3000 + 2000); // 2-5秒随机间隔
}

// 增加订单数量
function increaseOrderCount() {
    // 随机增加1-3个订单
    const increase = Math.floor(Math.random() * 3) + 1;
    pendingOrderCount += increase;
    
    // 更新显示
    const orderCountElement = document.getElementById('order-count');
    if (orderCountElement) {
        // 保存原来的动画
        const originalAnimation = orderCountElement.style.animation;
        
        // 移除动画
        orderCountElement.style.animation = 'none';
        
        // 触发重排
        void orderCountElement.offsetWidth;
        
        // 更新文本并添加增长动画
        orderCountElement.textContent = pendingOrderCount;
        orderCountElement.style.animation = 'orderCountIncrease 0.5s ease-out, pulse 1s infinite';
        
        // 如果订单数量超过一定值，增加紧迫感
        if (pendingOrderCount > 10) {
            orderCountElement.style.backgroundColor = '#ff0000';
        } else if (pendingOrderCount > 5) {
            orderCountElement.style.backgroundColor = '#ff4500';
        }
    }
    
    // 如果订单数量过多，可以添加提示音效或视觉效果
    if (pendingOrderCount > 15) {
        // 这里可以添加紧急提示效果
        const addPackageButton = document.getElementById('add-package');
        if (addPackageButton) {
            addPackageButton.classList.add('urgent');
            
            // 2秒后移除紧急效果
            setTimeout(() => {
                addPackageButton.classList.remove('urgent');
            }, 2000);
        }
    }
}