export const SkeletonRow = ({ columns = 3 }: { columns?: number }) => {
  const widths = columns === 4
    ? ['30%', '40%', '50%', '45%']
    : ['30%', '45%', '55%'];

  return (
    <tr className="animate-pulse">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-5 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-inner"
            style={{ width: widths[i], maxWidth: '100%' }}
          />
        </td>
      ))}
    </tr>
  );
};