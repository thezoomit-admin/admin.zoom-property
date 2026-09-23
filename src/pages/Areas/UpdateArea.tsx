import { Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  useGetAreaByIdQuery,
  useUpdateAreaMutation,
} from "../../redux/features/area/areaApi";
import AreaForm from "./AreaForm";
import AreaSubAreasPanel from "./AreaSubAreasPanel";

/**
 * Full page for editing an existing area + its sub-areas.
 */
const UpdateArea = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetAreaByIdQuery(id, { skip: !id });
  const [updateArea, { isLoading: saving }] = useUpdateAreaMutation();

  const onSubmit = async (values: any) => {
    try {
      const res: any = await updateArea({ id, data: values }).unwrap();
      toast.success(res?.message || "Area updated successfully");
      navigate("/areas");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the area");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-8">
      <AreaForm
        heading={`Edit area: ${data?.name || ""}`}
        submitLabel="Save changes"
        initial={data}
        saving={saving}
        onSubmit={onSubmit}
      />
      {id ? (
        <AreaSubAreasPanel areaId={id} areaName={data?.name} />
      ) : null}
    </div>
  );
};

export default UpdateArea;
