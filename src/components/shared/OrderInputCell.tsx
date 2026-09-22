import { Button, InputNumber, Tooltip } from "antd";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface OrderInputCellProps {
  record: any;
  index: number;
  onUpdateOrder: (id: string, nextOrder: number) => Promise<any>;
}

export const OrderInputCell = ({
  record,
  index,
  onUpdateOrder,
}: OrderInputCellProps) => {
  const currentOrder = typeof record.order === "number" ? record.order : index;
  const [val, setVal] = useState<number | null>(currentOrder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVal(typeof record.order === "number" ? record.order : index);
  }, [record.order, index]);

  const isChanged = val !== null && val !== undefined && val !== record.order;

  const handleSaveOrder = async () => {
    if (!isChanged || val === null || val === undefined) return;
    setLoading(true);
    try {
      await onUpdateOrder(record._id, val);
      toast.success("Order updated");
    } catch {
      toast.error("Could not update order");
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (targetOrder: number) => {
    if (targetOrder < 0 || loading) return;
    setVal(targetOrder);
    setLoading(true);
    try {
      await onUpdateOrder(record._id, targetOrder);
      toast.success("Order updated");
    } catch {
      toast.error("Could not update order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <InputNumber
        size="small"
        min={0}
        value={val}
        onChange={(v) => setVal(v)}
        onPressEnter={handleSaveOrder}
        disabled={loading}
        className="!w-14 text-center font-medium"
      />
      <Tooltip title={isChanged ? "Click tick to save" : "Unchanged"}>
        <Button
          type={isChanged ? "primary" : "default"}
          size="small"
          disabled={loading || !isChanged}
          icon={<Check className="h-3.5 w-3.5" />}
          onClick={handleSaveOrder}
          className={`!p-1 !h-6 !w-6 flex items-center justify-center rounded transition-all ${
            isChanged
              ? "!bg-primary-600 hover:!bg-primary-700 !text-white !border-primary-600 shadow-sm cursor-pointer"
              : "text-gray-300 border-gray-200"
          }`}
        />
      </Tooltip>
      <div className="flex flex-col gap-0.5">
        <Button
          type="text"
          size="small"
          disabled={loading || currentOrder <= 0}
          icon={<ArrowUp className="h-3.5 w-3.5" />}
          onClick={() => handleMove(currentOrder - 1)}
          className="!p-0.5 !h-5 !w-5 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer"
          title="Move Up"
        />
        <Button
          type="text"
          size="small"
          disabled={loading}
          icon={<ArrowDown className="h-3.5 w-3.5" />}
          onClick={() => handleMove(currentOrder + 1)}
          className="!p-0.5 !h-5 !w-5 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer"
          title="Move Down"
        />
      </div>
    </div>
  );
};

export default OrderInputCell;
