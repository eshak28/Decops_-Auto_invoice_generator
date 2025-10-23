(function () {
  const itemsContainer = document.getElementById('items');
  const addItemButton = document.getElementById('add-item');
  const form = document.getElementById('invoice-form');

  const subtotalEl = document.getElementById('subtotal');
  const taxEl = document.getElementById('tax');
  const totalEl = document.getElementById('total');

  const TAX_RATE = 0.18; // 18%

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  }

  function addItemRow(description = '', amount = '') {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input type="text" class="desc" placeholder="Item description" value="${description}" />
      <input type="number" class="amount" placeholder="0.00" step="0.01" min="0" value="${amount}" />
      <button type="button" class="remove" title="Remove">✕</button>
    `;

    row.querySelector('.remove').addEventListener('click', () => {
      row.remove();
      updateTotals();
    });

    const inputs = row.querySelectorAll('input');
    inputs.forEach((el) => el.addEventListener('input', updateTotals));

    itemsContainer.appendChild(row);
    updateTotals();
  }

  function getItems() {
    const rows = Array.from(itemsContainer.querySelectorAll('.item-row'));
    return rows
      .map((row) => {
        const description = row.querySelector('.desc').value.trim();
        const amount = parseFloat(row.querySelector('.amount').value);
        return { description, amount };
      })
      .filter((it) => it.description && isFinite(it.amount) && it.amount > 0);
  }

  function updateTotals() {
    const items = getItems();
    const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    subtotalEl.textContent = formatCurrency(subtotal);
    taxEl.textContent = formatCurrency(tax);
    totalEl.textContent = formatCurrency(total);
  }

  function todayIso() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  // Initialize
  document.getElementById('invoiceDate').value = todayIso();
  addItemRow('', '');

  addItemButton.addEventListener('click', () => addItemRow('', ''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = document.getElementById('customerName').value.trim();
    const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
    const date = document.getElementById('invoiceDate').value;

    const items = getItems();
    if (!customerName) {
      alert('Please enter a customer name.');
      return;
    }
    if (!items.length) {
      alert('Please add at least one valid item.');
      return;
    }

    const payload = { customerName, items, invoiceNumber, date, currency: 'USD', locale: 'en-US' };

    try {
      const res = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.errors ? err.errors.join('\n') : 'Failed to generate PDF';
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = invoiceNumber || new Date().getTime();
      a.href = url;
      a.download = `invoice-${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'An error occurred while generating the PDF.');
    }
  });
})();
