import { useSales } from "@/contexts/SalesContext";

const RecentSalesTable = () => {
  const { todaySales } = useSales();
  // Show up to 5 most recent transactions from today
  const recent = todaySales.slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-card-foreground">Recent Sales</h3>
        <p className="text-xs text-muted-foreground">Today's transactions</p>
      </div>
      <div className="overflow-x-auto">
        {recent.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            No sales recorded today yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Worker</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs text-primary">{sale.id}</td>
                  <td className="px-5 py-3 text-card-foreground">{sale.item}</td>
                  <td className="px-5 py-3 text-muted-foreground">{sale.worker}</td>
                  <td className="px-5 py-3 text-right font-mono font-medium text-card-foreground">
                    ${sale.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {sale.payment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentSalesTable;
