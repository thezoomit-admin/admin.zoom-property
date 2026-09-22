import { Spin } from "antd";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  useGetProjectLandingQuery,
  useSaveProjectLandingMutation,
} from "../../redux/features/project/projectApi";
import ProjectLandingForm from "./ProjectLandingForm";

const ProjectLandingPage = () => {
  const { id = "" } = useParams();
  const { data, isLoading } = useGetProjectLandingQuery(id, { skip: !id });
  const [saveLanding, { isLoading: saving }] = useSaveProjectLandingMutation();

  const onSubmit = async (values: Record<string, unknown>) => {
    await saveLanding({ id, data: values }).unwrap();
    toast.success("Landing page saved", { position: "top-center" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spin />
      </div>
    );
  }

  return (
    <ProjectLandingForm
      project={data?.project}
      initial={data?.landing}
      saving={saving}
      onSubmit={onSubmit}
    />
  );
};

export default ProjectLandingPage;
