import type { Invoice } from "@interfaces/index";
import { formatAmount } from "@utils/formatAmount";
import { formatDisplayDate } from "@utils/displayDate";

export default function SalesInvoiceList({
  invoices,
}: {
  invoices: Invoice[];
}) {
  if (!invoices.length) {
    return <p className="finance-empty-detail">No invoices in this period.</p>;
  }

  return (
    <ul className="sales-invoice-list">
      {invoices.map((invoice, index) => (
        <li key={`${invoice.number}-${index}`}>
          <div className="sales-invoice-identity">
            <span className="sales-invoice-number">#{invoice.number}</span>
            <span className="sales-invoice-date">
              Delivery{" "}
              <time dateTime={invoice.delivery_date}>
                {formatDisplayDate(invoice.delivery_date)}
              </time>
            </span>
          </div>
          <div className="sales-invoice-description">
            <p className="sales-invoice-customer">{invoice.customer}</p>
            {invoice.care_of && (
              <p className="finance-caption">{invoice.care_of}</p>
            )}
            {!!invoice.items.length && (
              <ul className="sales-invoice-items">
                {invoice.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <span className="sales-invoice-amount">
            {formatAmount(invoice.total_price)}
          </span>
        </li>
      ))}
    </ul>
  );
}
