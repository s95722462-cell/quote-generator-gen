console.log("script.js version 6.0 loaded!");

document.addEventListener('DOMContentLoaded', function() {
    let originalData = null;
    const quoteEditor = document.getElementById('quote-editor');
    const saveButton = document.getElementById('save-button');
    const savePdfButton = document.getElementById('save-pdf-button');
    const saveJpgButton = document.getElementById('save-jpg-button');

    // New helper functions for number formatting and parsing
    function formatNumber(num) {
        // Convert to number first to handle string "0" or 0.0
        const numericValue = Number(num);
        if (isNaN(numericValue) || numericValue === null || numericValue === undefined || numericValue === 0) {
            return '';
        }
        return numericValue.toLocaleString('ko-KR');
    }

    function parseNumber(str) {
        if (!str) return 0;
        return parseFloat(String(str).replace(/,/g, '')); // Remove commas before parsing
    }

    fetch('quote.json')
        .then(response => response.json())
        .then(data => {
            originalData = data;
            renderEditor(data);
            setupCalculations(); // Setup calculations after rendering
        })
        .catch(error => {
            console.error('Error fetching quote data:', error);
            quoteEditor.innerHTML = '<p style="color:red;">견적서 데이터를 불러오는데 실패했습니다.</p>';
        });

    function renderEditor(data) {
        let html = '';

        const createInput = (row, key, value, placeholder = '') => {
            // Ensure value is a string and escape double quotes for HTML attribute
            const escapedValue = String(value || '').replace(/"/g, '&quot;');
            let className = ''; // Use className instead of style
            // Apply center alignment only if it's the 'No.', '수량', or '단위' column AND it's within the item table rows (rowIndex >= 14)
            if ((key === '' || key === '__4' || key === '__5' || key === '__8') && row >= 14) { // Added __8 for 납기
                className = 'text-center-input';
            } else if ((key === '__6' || key === '__7') && row >= 14) { // For 단가 and 금액 in item table
                className = 'text-right-input';
            }
            return `<input type="text" data-row="${row}" data-key="${key}" value="${escapedValue}" placeholder="${placeholder}" class="${className}">`;
        };
        
        const createTextarea = (row, key, value) => {
            // Ensure value is a string and escape for HTML content
            const escapedValue = String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;'); // Corrected: was >gt; 
            return `<textarea data-row="${row}" data-key="${key}">${escapedValue}</textarea>`;
        };

        // Header
        html += `<h1><input type="text" data-row="0" data-key="__1" value="${data[0]['__1']}" style="text-align:center; font-size:32px; border:none;"></h1>`;
        
        html += `<div class="quote-header">`;
        html += `<div class="quote-no-date">
                    <p>${createInput(4, '', data[4][''])}</p>
                    <p>${createInput(4, '__6', data[4]['__6'])}</p>
                 </div>`;
        html += `<div class="parties">
                    <div class="to-party">
                        <h3>To</h3>
                        <p>${createInput(5, '', data[5][''].replace('To ', ''))}</p>
                        <p>Attn: ${createInput(6, '', data[6][''].replace('Attn ', ''))}</p>
                        <p>Tel: ${createInput(7, '', data[7][''].replace('Tel ', ''))}</p>
                        <p>e-mail: ${createInput(8, '__1', data[8]['__1'])}</p>
                    </div>
                    <div class="from-party">
                        <h3>From</h3>
                        <p>${createInput(5, '__6', data[5]['__6'])}</p>
                        <p>Name: ${createInput(6, '__6', data[6]['__6'])}</p>
                        <p>Tel: ${createInput(7, '__6', data[7]['__6'])}</p>
                        <p>e-mail: ${createInput(8, '__6', data[8]['__6'])}</p>
                    </div>
                 </div></div>`;

        // Greetings
        html += `<div class="quote-greeting">
                    <p>${createInput(10, '', data[10][''])}</p>
                    <p>${createInput(11, '', data[11][''])}</p>
                 </div>`;

        // Items table
        const itemHeaders = data[13];
        const excludedKeys = ['__1', '__3']; // Keys for '품목' and '상태'
        const headerKeys = Object.keys(itemHeaders).filter(k => itemHeaders[k] && !excludedKeys.includes(k));
        html += `<div class="quote-body"><table><thead><tr>`;

        const columnWidths = {
            '': '7%',     // No.
            '__2': '43%', // 규격
            '__4': '7%',  // 수량
            '__5': '7%',  // 단위
            '__6': '12%', // 단가
            '__7': '12%', // 금액
            '__8': '12%'  // 납기
        };

        headerKeys.forEach(key => {
            const thStyle = `width: ${columnWidths[key] || 'auto'};`; // Use 'auto' for keys not in map
            html += `<th style="${thStyle}">${itemHeaders[key]}</th>`;
        });
        html += `</tr></thead><tbody>`;

        for (let i = 0; i < 10; i++) {
            const rowIndex = 14 + i;
            html += `<tr>`;
            headerKeys.forEach(key => {
                const value = (data[rowIndex] && data[rowIndex][key]) ? data[rowIndex][key] : '';
                // Apply formatting for 단가 and 금액 columns
                if (key === '__6' || key === '__7') { // 단가 or 금액
                    html += `<td>${createInput(rowIndex, key, formatNumber(value))}</td>`;
                } else {
                    html += `<td>${createInput(rowIndex, key, value)}</td>`;
                }
            });
            html += `</tr>`;
        }
        html += `</tbody>`;

        // Footer (Total)
        html += `<tfoot><tr>`;
        html += `<td colspan="3" style="text-align:right; border:none;"></td>`;
        html += `<td>합계금액</td>`; // bottom of "단위" column
        html += `<td colspan="2">${createInput(34, '__7', data[34]['__7'])}</td>`; // bottom of "금액" column, now spans "단가" and "금액"
        html += `<td style="border:none;"></td>`; // bottom of "납기" column
        html += `</tr></tfoot></table></div>`;

        // Terms and Remarks
        html += `<div class="quote-footer">
                    <div class="terms">
                        <h3>계약 및 지불조건</h3>
                        ${createTextarea(35, '', data[35][''])}
                    </div>
                    <div class="remarks">
                        <h3>참고사항</h3>
                        ${createTextarea(35, '__5', data[35]['__5'])}
                    </div>
                 </div>`;
        
        // Address
        html += `<div class="quote-address"><p>${createInput(40, '', data[40][''])}</p></div>`;

        quoteEditor.innerHTML = html;
    }

    function setupCalculations() {
        const itemRows = quoteEditor.querySelectorAll('tbody tr');

        itemRows.forEach(row => {
            const quantityInput = row.querySelector('input[data-key="__4"]'); // 수량
            const unitPriceInput = row.querySelector('input[data-key="__6"]'); // 단가
            const amountInput = row.querySelector('input[data-key="__7"]'); // 금액

            if (quantityInput && unitPriceInput && amountInput) {
                const calculateAmount = () => {
                    const quantity = parseNumber(quantityInput.value);
                    const unitPrice = parseNumber(unitPriceInput.value);
                    const amount = quantity * unitPrice;
                    amountInput.value = formatNumber(amount);
                };

                quantityInput.addEventListener('input', calculateAmount);
                unitPriceInput.addEventListener('input', calculateAmount);

                // Reformat unit price on input change
                unitPriceInput.addEventListener('input', () => {
                    unitPriceInput.value = formatNumber(parseNumber(unitPriceInput.value));
                });

                // Add Enter key functionality to move focus
                unitPriceInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault(); // Prevent default Enter behavior

                        // Find all editable inputs on the page
                        const allInputs = Array.from(quoteEditor.querySelectorAll('input[data-row], textarea[data-row]'));
                        const currentIndex = allInputs.indexOf(unitPriceInput);

                        if (currentIndex > -1 && currentIndex < allInputs.length - 1) {
                            allInputs[currentIndex + 1].focus(); // Move focus to the next input
                        }
                    }
                });

                // Initial calculation for existing values
                calculateAmount();
            }
        });
    }

    saveButton.addEventListener('click', () => {
        if (!originalData) return;

        const updatedData = JSON.parse(JSON.stringify(originalData));

        const inputs = quoteEditor.querySelectorAll('input[data-row], textarea[data-row]');
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row, 10);
            const key = input.dataset.key;
            
            // Special handling for fields where I removed a prefix
            if (row === 5 && key === '') {
                updatedData[row][key] = 'To ' + input.value;
            } else if (row === 6 && key === '') {
                updatedData[row][key] = 'Attn ' + input.value;
            } else if (row === 7 && key === '') {
                updatedData[row][key] = 'Tel ' + input.value;
            } else {
                // For numbers, store the raw number without commas
                if (key === '__4' || key === '__6' || key === '__7') { // 수량, 단가, 금액
                    updatedData[row][key] = parseNumber(input.value);
                } else {
                    updatedData[row][key] = input.value;
                }
            }
        });

        const jsonString = JSON.stringify(updatedData, null, 2);

        const outputContainer = document.getElementById('output-container');
        const jsonOutput = document.getElementById('json-output');
        const downloadLink = document.getElementById('download-link');

        jsonOutput.textContent = jsonString;

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        downloadLink.href = url;
        downloadLink.download = '견적서_수정.json';
        
        outputContainer.style.display = 'block';
        downloadLink.style.display = 'block';
    });
});