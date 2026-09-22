import { Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  useGetProjectLandingQuery,
  useSaveProjectLandingMutation,
} from "../../redux/features/project/projectApi";
import ProjectLandingForm from "./ProjectLandingForm";

const ProjectLandingPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetProjectLandingQuery(id, { skip: !id });
  const [saveLanding, { isLoading: saving }] = useSaveProjectLandingMutation();

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await saveLanding({ id, data: values }).unwrap();
      toast.success("Landing page saved");
      navigate("/projects");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the landing page");
    }
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
