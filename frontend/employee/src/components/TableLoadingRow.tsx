import LoadingSpinner from "@components/LoadingSpinner";

/** Keep table headings visible while matching the workspace loading style. */
export default function TableLoadingRow({
  columns,
  message,
}: {
  columns: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={columns}>
        <LoadingSpinner message={message} />
      </td>
    </tr>
  );
}
