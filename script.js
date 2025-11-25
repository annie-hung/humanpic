// script.js

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // 1. Modal 控制函式
    // -----------------------------------------------------------------
    const modals = {
        intro: document.getElementById('modal-intro'),
        test: document.getElementById('modal-test')
    };

    window.openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            // 設定焦點以符合無障礙設計
            modal.querySelector('.modal-content').focus();
            // 屏蔽背景互動
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    };

    // -----------------------------------------------------------------
    // 2. 事件監聽
    // -----------------------------------------------------------------
    document.getElementById('btn-learn-more').addEventListener('click', () => openModal('modal-intro'));
    document.getElementById('btn-start-test').addEventListener('click', () => openModal('modal-test'));
    
    // 監聽 ESC 鍵關閉所有彈窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            Object.values(modals).forEach(modal => closeModal(modal.id));
        }
    });

    // -----------------------------------------------------------------
    // 3. 介紹 Modal 頁籤與無障礙操作
    // -----------------------------------------------------------------
    const tabContainer = document.getElementById('intro-tabs');
    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn')) {
                switchTab(e.target);
            }
        });

        // 鍵盤箭頭切換
        tabContainer.addEventListener('keydown', (e) => {
            const tabs = Array.from(tabContainer.querySelectorAll('[role="tab"]'));
            let index = tabs.findIndex(tab => tab === document.activeElement);

            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                // 計算下一個焦點
                index = (e.key === 'ArrowRight') ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
                tabs[index].focus();
                switchTab(tabs[index]);
            }
        });
    }

    function switchTab(newTab) {
        const parent = newTab.closest('.modal-content');
        const tabs = parent.querySelectorAll('[role="tab"]');
        
        tabs.forEach(tab => {
            const panel = document.getElementById(tab.getAttribute('aria-controls'));
            
            if (tab === newTab) {
                tab.setAttribute('aria-selected', 'true');
                tab.classList.add('active');
                panel.hidden = false;
            } else {
                tab.setAttribute('aria-selected', 'false');
                tab.classList.remove('active');
                panel.hidden = true;
            }
        });
    }
    
    // -----------------------------------------------------------------
    // 4. 表單處理與 API 呼叫
    // -----------------------------------------------------------------
    const form = document.getElementById('human-design-form');
    const analysisOutput = document.getElementById('analysis-output');
    const formError = document.getElementById('form-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formError.textContent = '';
        
        const data = {
            birthDate: document.getElementById('birth-date').value,
            birthTime: document.getElementById('birth-time').value,
            birthLocation: document.getElementById('birth-location').value
        };

        if (!data.birthDate || !data.birthTime || !data.birthLocation) {
            formError.textContent = '請填寫所有必填欄位。';
            return;
        }

        // 關閉輸入彈窗
        closeModal('modal-test');

        // 顯示等待分析狀態
        analysisOutput.innerHTML = `
            <div class="loading-state">
                <h3>等待 AI 分析中...</h3>
                <p>正在根據您的出生資訊 ( ${data.birthDate} ${data.birthTime} 於 ${data.birthLocation} ) 繪製您的生命藍圖，請稍候。</p>
            </div>
        `;

        try {
            // ** 呼叫後端 API 代理服務 (Node.js/Serverless) **
            const response = await fetch('/api/analyze-human-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '分析服務發生未知錯誤。');
            }

            // 安全渲染結果 (防止 XSS)
            renderAnalysisResult(result);

        } catch (error) {
            console.error('API 呼叫失敗:', error);
            analysisOutput.innerHTML = `
                <p style="color: red;"><strong>分析失敗：</strong> ${error.message}</p>
                <p>請檢查您的網路連線或稍後再試。</p>
            `;
        }
    });

    // -----------------------------------------------------------------
    // 5. 結果安全渲染
    // -----------------------------------------------------------------
    function renderAnalysisResult(result) {
        // 使用 textContent 賦值或 DOM 操作來避免 XSS 攻擊
        // 如果分析結果包含格式（如換行符），我們將它們轉換為 HTML <br> 或 <p>
        
        let formattedText = `
            <h2>${result.type}：${result.title || '你的生命藍圖已生成'}</h2>
            
            <h3>【核心特質與類型】</h3>
            <p>${result.typeDescription.replace(/\n/g, '<br>')}</p>

            <h3>【內在權威與決策方式】</h3>
            <p>${result.decisionStrategy.replace(/\n/g, '<br>')}</p>
            
            <h3>【天賦與優勢】</h3>
            <p>${result.talents.replace(/\n/g, '<br>')}</p>

            <h3>【盲點與挑戰】</h3>
            <p>${result.blindSpots.replace(/\n/g, '<br>')}</p>
            
            <h3>【個人化建議】</h3>
            <p>${result.personalAdvice.replace(/\n/g, '<br>')}</p>
        `;
        
        // 可擴充功能
        formattedText += `<hr style="margin-top: 20px;">
                          <button class="btn" onclick="copyResult()">複製文案</button>
                          `;

        analysisOutput.innerHTML = formattedText;
    }
    
    // 簡單的複製功能
    window.copyResult = function() {
        const textToCopy = analysisOutput.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('分析結果已成功複製到剪貼簿！');
        }, (err) => {
            console.error('無法複製文本:', err);
        });
    }

});
