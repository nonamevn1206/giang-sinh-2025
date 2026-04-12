window.isInventoryOpen = false;

// Dữ liệu kho đồ tĩnh
const inventoryData = [
    { type: 4, label: 'Gỗ', count: 64 },
    { type: 3, label: 'Đá', count: 64 },
    null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null, null
];

// Crafting data (2x2)
const craftingGrid = [null, null, null, null];
let currentResult = null;

function initInventoryUI() {
    const invGrid = document.getElementById('inventory-grid');
    invGrid.innerHTML = '';
    
    // Khởi tạo 18 slots
    for (let i=0; i<18; i++) {
        invGrid.innerHTML += `<div class="inv-slot border-slot" data-slot="i${i}" ondragover="allowDrop(event)" ondrop="drop(event)"></div>`;
    }
    
    setupGridEvents();
    renderInventory();
}

function setupGridEvents() {
    document.querySelectorAll('.inv-slot').forEach(slot => {
        slot.setAttribute('ondragover', 'allowDrop(event)');
        slot.setAttribute('ondrop', 'drop(event)');
    });
}

function renderInventory() {
    // Render túi đồ
    for (let i=0; i<18; i++) {
        const slotEl = document.querySelector(`[data-slot="i${i}"]`);
        slotEl.innerHTML = '';
        if (inventoryData[i]) {
            slotEl.appendChild(createItemElement(inventoryData[i], `i${i}`));
        }
    }
    
    // Render bàn chế tạo
    for (let i=0; i<4; i++) {
        const slotEl = document.querySelector(`[data-slot="c${i}"]`);
        slotEl.innerHTML = '';
        if (craftingGrid[i]) {
            slotEl.appendChild(createItemElement(craftingGrid[i], `c${i}`));
        }
    }
    
    // Render kết quả
    const resultEl = document.querySelector(`[data-slot="r0"]`);
    resultEl.innerHTML = '';
    if (currentResult) {
        resultEl.appendChild(createItemElement(currentResult, `r0`, false)); // Không cho kéo lại vào túi, bắt buộc click để lấy (giống MC)
    }
}

function createItemElement(item, sourceSlot, draggable=true) {
    const el = document.createElement('div');
    el.className = 'item-icon';
    el.innerText = item.label + (item.count > 1 ? ` (${item.count})` : '');
    
    if (item.label === 'Ván Gỗ') el.style.backgroundColor = '#cd853f';
    if (item.label === 'Gỗ') el.style.backgroundColor = '#8b4513';
    if (item.label === 'Đá') el.style.backgroundColor = '#808080';
    if (item.label === 'Bàn Chế Tạo') el.style.backgroundColor = '#deb887';
    
    if (draggable) {
        el.draggable = true;
        el.ondragstart = (e) => {
            e.dataTransfer.setData("text", sourceSlot);
        };
    } else {
        // Đây là ô kết quả, click để nhận đồ
        el.onclick = () => takeCraftingResult();
    }
    
    return el;
}

window.allowDrop = (ev) => ev.preventDefault();

window.drop = (ev) => {
    ev.preventDefault();
    const sourceSlot = ev.dataTransfer.getData("text");
    let targetEl = ev.target;
    if(targetEl.classList.contains('item-icon')) targetEl = targetEl.parentElement;
    const targetSlot = targetEl.getAttribute('data-slot');
    
    if(!targetSlot || targetSlot === 'r0' || sourceSlot === targetSlot) return; // R0 là read-only dể đặt thủ công
    
    // Logic di chuyển item
    let item = null;
    if (sourceSlot.startsWith('i')) {
        item = inventoryData[parseInt(sourceSlot.substring(1))];
        inventoryData[parseInt(sourceSlot.substring(1))] = null;
    } else if (sourceSlot.startsWith('c')) {
        item = craftingGrid[parseInt(sourceSlot.substring(1))];
        craftingGrid[parseInt(sourceSlot.substring(1))] = null;
    }
    
    // Quăng đè đồ cũ
    let oldTargetItem = null;
    if (targetSlot.startsWith('i')) {
        oldTargetItem = inventoryData[parseInt(targetSlot.substring(1))];
        inventoryData[parseInt(targetSlot.substring(1))] = item;
    } else if (targetSlot.startsWith('c')) {
        oldTargetItem = craftingGrid[parseInt(targetSlot.substring(1))];
        craftingGrid[parseInt(targetSlot.substring(1))] = item;
    }
    
    // Đổi chõ
    if (oldTargetItem) {
         if (sourceSlot.startsWith('i')) inventoryData[parseInt(sourceSlot.substring(1))] = oldTargetItem;
         else craftingGrid[parseInt(sourceSlot.substring(1))] = oldTargetItem;
    }
    
    checkCraftingRecipes();
    renderInventory();
}

function checkCraftingRecipes() {
    // Thuật toán quét 2x2 cực kỳ Đơn giản
    const g = craftingGrid.map(item => item ? item.label : null);
    
    // Xoá kq cũ
    currentResult = null;
    
    // Đủ 4 ván gỗ -> Bàn chế tạo
    if (g.every(i => i === 'Ván Gỗ')) {
        currentResult = { type: 5, label: 'Bàn Chế Tạo', count: 1 };
        return;
    }
    
    // Bất kỳ 1 ô nào có Gỗ nguyên khối -> Ván gỗ x4
    let woodCount = g.filter(i => i === 'Gỗ').length;
    let onlyWoods = g.every(i => i === 'Gỗ' || i === null);
    if (woodCount === 1 && onlyWoods) {
        currentResult = { type: 5, label: 'Ván Gỗ', count: 4 };
        return;
    }
}

function takeCraftingResult() {
    if(!currentResult) return;
    
    // Tìm ô rỗng trong túi để tống vào
    let emptySlot = inventoryData.findIndex(i => i === null);
    if (emptySlot === -1) return; // Túi đầy
    
    inventoryData[emptySlot] = currentResult;
    
    // Trừ tài nguyên (Xóa mỗi ô 1 cái khối gốc)
    for(let i=0; i<4; i++) {
        if(craftingGrid[i]) {
             craftingGrid[i].count--;
             if(craftingGrid[i].count <= 0) craftingGrid[i] = null;
        }
    }
    
    checkCraftingRecipes();
    renderInventory();
}

// Bật tắt UI
window.toggleInventory = () => {
    window.isInventoryOpen = !window.isInventoryOpen;
    const invScreen = document.getElementById('inventory-screen');
    
    if (window.isInventoryOpen) {
        controls.unlock();
        invScreen.style.display = 'block';
        if (!document.getElementById('inventory-grid').innerHTML) initInventoryUI();
    } else {
        invScreen.style.display = 'none';
        controls.lock();
    }
}
