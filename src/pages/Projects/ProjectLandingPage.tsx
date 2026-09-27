import { Button, Result, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import {
  useGetProjectLandingQuery,
  useSaveProjectLandingSectionMutation,
} from "../../redux/features/project/projectApi";
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
  };

  if (isLoading || (isFetching && !data)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 py-20">
        <Spin size="large" />
        <p className="text-sm text-secondary-500 font-medium">
          প্রকল্পের ল্যান্ডিং পেজ লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (isError || !data?.project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Result
          status="404"
          title="প্রকল্প পাওয়া যায়নি"
          subTitle="এই আইডি বিশিষ্ট প্রকল্পের কোনো ল্যান্ডিং পেজ তথ্য পাওয়া যায়নি অথবা সার্ভার থেকে লোড হতে ব্যর্থ হয়েছে।"
          extra={
            <Button
              type="primary"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/projects")}
            >
              প্রকল্প তালিকায় ফিরে যান
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
