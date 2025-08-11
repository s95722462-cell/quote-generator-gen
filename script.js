document.addEventListener('DOMContentLoaded', () => {
    const itemTableBody = document.querySelector('#itemTable tbody');
    const addItemBtn = document.getElementById('addItemBtn');
    const deleteLastItemBtn = document.getElementById('deleteLastItemBtn');
    const totalAmountSpan = document.getElementById('totalAmount');
    const captureBtn = document.getElementById('captureBtn');
    const quoteFormContainer = document.getElementById('quote-form-container');

    let itemCounter = 0;

    // Function to format number with commas, or return empty string if 0
    function formatNumberWithCommas(number) {
        if (number === 0) {
            return '';
        }
        return number.toLocaleString('ko-KR');
    }

    // Function to add a new item row
    function addItem() {
        itemCounter++;
        const newRow = itemTableBody.insertRow();
        newRow.innerHTML = `
            <td>${itemCounter}</td>
            <td><input type="text" class="form-control item-name" placeholder="품명"></td>
            <td><input type="number" class="form-control item-quantity" value="1" min="0" placeholder="1"></td>
            <td><input type="text" class="form-control item-unit-price" value=""></td> <!-- Initial value empty for 0 -->
            <td class="item-amount"></td> <!-- Initial value empty for 0 -->
        `;

        const itemNameInput = newRow.querySelector('.item-name');
        const quantityInput = newRow.querySelector('.item-quantity');
        const unitPriceInput = newRow.querySelector('.item-unit-price');

        quantityInput.addEventListener('input', () => calculateRowAmount(newRow));
        
        // Add input event listener for formatting unit price
        unitPriceInput.addEventListener('input', (event) => {
            let value = event.target.value.replace(/[^0-9]/g, ''); // Remove non-digits
            let numericValue = parseInt(value || 0);
            event.target.value = formatNumberWithCommas(numericValue);
            calculateRowAmount(newRow);
        });

        // Add keydown event listener for Enter key on unit price input
        unitPriceInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission
                const currentRow = event.target.closest('tr');
                const nextRow = currentRow.nextElementSibling;

                if (nextRow) {
                    // Focus on the item name input of the next row
                    nextRow.querySelector('.item-name').focus();
                } else {
                    // If it's the last row, add a new item and focus on its item name input
                    addItemBtn.click(); // Programmatically click the add item button
                    // After addItem, the new row will be the last one
                    const newAddedRow = itemTableBody.lastElementChild;
                    if (newAddedRow) {
                        newAddedRow.querySelector('.item-name').focus();
                    }
                }
            }
        });

        updateRowNumbers();
        calculateRowAmount(newRow); // Calculate initial amount for the new row
    }

    // Function to delete the last item row
    function deleteLastItem() {
        if (itemTableBody.children.length > 0) {
            itemTableBody.lastElementChild.remove();
            updateRowNumbers();
            calculateTotal();
        }
    }

    // Function to calculate amount for a single row
    function calculateRowAmount(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        // Remove commas before parsing unit price
        const unitPrice = parseFloat(row.querySelector('.item-unit-price').value.replace(/,/g, '')) || 0;
        const amount = quantity * unitPrice;
        row.querySelector('.item-amount').textContent = formatNumberWithCommas(amount);
        calculateTotal();
    }

    // Function to calculate total amount
    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('.item-amount').forEach(amountCell => {
            // Remove non-numeric characters (like commas) before parsing
            total += parseFloat(amountCell.textContent.replace(/,/g, '')) || 0;
        });
        totalAmountSpan.textContent = formatNumberWithCommas(total);
    }

    // Function to update row numbers
    function updateRowNumbers() {
        const rows = itemTableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
        });
        itemCounter = rows.length; // Keep itemCounter in sync with actual rows
    }

    // Event listener for Add Item button
    addItemBtn.addEventListener('click', addItem);

    // Event listener for Delete Last Item button
    deleteLastItemBtn.addEventListener('click', deleteLastItem);

    // Event listener for Capture button
    captureBtn.addEventListener('click', () => {
        // Temporarily hide buttons that shouldn't be in the screenshot
        addItemBtn.style.display = 'none';
        deleteLastItemBtn.style.display = 'none';
        captureBtn.style.display = 'none';

        html2canvas(quoteFormContainer, {
            scale: 2, // Increase scale for better quality
            useCORS: true // Important for images if any
        }).then(canvas => {
            // Re-show buttons
            addItemBtn.style.display = '';
            deleteLastItemBtn.style.display = '';
            captureBtn.style.display = '';

            const link = document.createElement('a');
            link.download = '견적서.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // Add an initial item row when the page loads
    addItem();
});
