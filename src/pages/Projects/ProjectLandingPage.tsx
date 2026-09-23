import { Spin } from "antd";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  useGetProjectLandingQuery,
  useSaveProjectLandingSectionMutation,
} from "../../redux/features/project/projectApi";
import ProjectLandingForm from "./ProjectLandingForm";

const ProjectLandingPage = () => {
  const { id = "" } = useParams();
  const { data, isLoading } = useGetProjectLandingQuery(id, { skip: !id });
  const [saveSection, { isLoading: saving }] =
    useSaveProjectLandingSectionMutation();

  const onSubmitSection = async (
    section: string,
    values: Record<string, unknown>,
  ) => {
    await saveSection({ id, section, data: values }).unwrap();
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
      onSubmitSection={onSubmitSection}
    />
  );
};

export default ProjectLandingPage;
