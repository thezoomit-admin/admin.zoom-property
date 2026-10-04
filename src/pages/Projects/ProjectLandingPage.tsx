import { Button, Result, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import {
  useGetProjectLandingQuery,
  useSaveProjectLandingSectionMutation,
} from "../../redux/features/project/projectApi";
import { revalidateFrontend } from "../../utils/revalidateFrontend";
import ProjectLandingForm from "./ProjectLandingForm";

const ProjectLandingPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isFetching, isError } = useGetProjectLandingQuery(id, {
    skip: !id,
  });
  const [saveSection, { isLoading: saving }] =
    useSaveProjectLandingSectionMutation();

  const onSubmitSection = async (
    section: string,
    values: Record<string, unknown>,
  ) => {
    await saveSection({ id, section, data: values }).unwrap();
    // Bust the frontend Next.js cache so show/hide changes are immediate
    revalidateFrontend("projects");
  };

  if (isLoading || (isFetching && !data)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 py-20">
        <Spin size="large" />
        <p className="text-sm text-secondary-500 font-medium">
          Loading project landing page...
        </p>
      </div>
    );
  }

  if (isError || !data?.project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Result
          status="404"
          title="Project not found"
          subTitle="No landing page was found for this project, or the server could not load it."
          extra={
            <Button
              type="primary"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/projects")}
            >
              Back to projects
            </Button>
          }
        />
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
