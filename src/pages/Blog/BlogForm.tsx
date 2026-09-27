import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  Tooltip,
} from "antd";
import { ArrowLeft, Languages, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import LangInput from "../../components/Common/LangInput";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import RichTextEditor from "../../components/Common/RichEditor/RichTextEditor";
import UploadMedia from "../../components/shared/UploadMedia";
import { useGetBlogCategoriesQuery } from "../../redux/features/blog/blogApi";
import { mediaSrc } from "../../utils/mediaSrc";
import {
  isEmptyRichText,
  translateRichTextToBangla,
} from "../../utils/richText";

interface Props {
  /** Undefined when writing a new one. */
  initial?: any;
  saving: boolean;
  onSubmit: (values: any) => Promise<void>;
  heading: string;
  submitLabel: string;
}

/** What a search engine will actually print before it truncates. */
const META_TITLE_MAX = 70;
const META_DESCRIPTION_MAX = 160;

/**
 * One form for writing and editing an article.
 *
 * A page rather than a modal: an article is a long piece of work with a body
 * editor in it, and a dialogue that tall has nowhere to put the scroll. The
 * listing and project forms are pages for the same reason.
 *
 * `readMinutes` is absent on purpose — the API computes it from the body at
 * 200 words a minute, which never disagrees with the article the way a
 * hand-typed number does after an edit. So are `slug` and `publishedAt`.
 */
const BlogForm = ({ initial, saving, onSubmit, heading, submitLabel }: Props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [translatingBody, setTranslatingBody] = useState(false);

  const { data: categories = [] } = useGetBlogCategoriesQuery({});

  useEffect(() => {
    if (!initial) return;
    form.setFieldsValue({
      ...initial,
      categories: initial.categories?.map((c: any) => c._id ?? c) || [],
      coverImage: initial.coverImage?._id ?? initial.coverImage,
      coverImageUrl: mediaSrc(initial.coverImage),
      thumbnail: initial.thumbnail?._id ?? initial.thumbnail,
      thumbnailUrl: mediaSrc(initial.thumbnail),
    });
  }, [initial, form]);

  const handleTranslateBody = async () => {
    const enText = form.getFieldValue("content");
    if (isEmptyRichText(enText)) {
      toast.info("অনুবাদের জন্য আগে ইংরেজিতে লেখাটি (English body) লিখুন");
      return;
    }
    setTranslatingBody(true);
    try {
      form.setFieldsValue({ contentBn: await translateRichTextToBangla(enText) });
      toast.success("লেখাটি বাংলায় রূপান্তর করা হয়েছে!");
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setTranslatingBody(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const isSaving = saving || submitting;

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const { coverImageUrl, thumbnailUrl, ...rest } = values;
      void coverImageUrl;
      void thumbnailUrl;
      await onSubmit(rest);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta title={`${heading} · Zoom Property Admin`} noindex />
      <PageHeader
        title={heading}
        subtitle="Everything the website shows about this article"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Blog", path: "/blog" },
          { title: heading },
        ]}
        extra={
          <Button
            icon={<ArrowLeft className="size-4" />}
            onClick={() => navigate("/blog")}
          >
            Back to blog
          </Button>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          status: "draft",
          featured: false,
          trending: false,
          isHome: false,
        }}
        className="space-y-4"
      >
        <Card title="The article">
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <LangInput
                label="Title"
                name="title"
                lang="en"
                required
                placeholder="What the flat next door actually sold for"
              />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Categories"
                name="categories"
                rules={[{ required: true, message: "Pick at least one category" }]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select a category"
                  options={(categories || []).map((c: any) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={16}>
              <LangInput
                label="Title (Bangla)"
                name="titleBn"
                lang="bn"
                sourceFieldName="title"
                form={form}
                placeholder="বাংলা শিরোনাম"
              />
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Excerpt"
                name="excerpt"
                tooltip="The card summary. Written, not truncated from the body."
              >
                <Input.TextArea autoSize={{ minRows: 3 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Excerpt (Bangla)" name="excerptBn">
                <Input.TextArea autoSize={{ minRows: 3 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="The body">
          <Form.Item label="Body" name="content">
            <RichTextEditor
              placeholder="Write the article in English..."
              height={520}
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="flex w-full items-center justify-between gap-2">
                <span>Body (Bangla)</span>
                <Tooltip title="ইংরেজিতে লেখা থেকে বাংলায় রূপান্তর করুন">
                  <Button
                    type="link"
                    size="small"
                    className="!h-auto !px-1 !text-xs flex shrink-0 items-center gap-1 whitespace-nowrap"
                    onClick={handleTranslateBody}
                    loading={translatingBody}
                    icon={
                      translatingBody ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Languages className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {translatingBody ? "রূপান্তর হচ্ছে..." : "বাংলা করুন"}
                  </Button>
                </Tooltip>
              </div>
            }
            name="contentBn"
          >
            <RichTextEditor placeholder="বাংলায় লিখুন..." height={520} />
          </Form.Item>
        </Card>

        <Card title="Images">
          <p className="mb-6 rounded-md bg-secondary-50 p-3 text-xs leading-relaxed text-secondary-600">
            <strong>Design Guidelines:</strong> Two different crops doing two different jobs. The <strong>Cover image</strong> is wide (use a 16:9 aspect ratio, e.g. 1200x675) and carries the headline over it on the article page. The <strong>Thumbnail image</strong> is closer and used for blog cards (use a 4:3 or 1:1 aspect ratio, e.g. 800x600). Leave the thumbnail empty and the card will fall back to the cover image.
          </p>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Cover image"
                name="coverImageUrl"
                tooltip="The wide banner on the article page. Landscape, roughly 16:9."
              >
                <UploadMedia
                  form={form}
                  fieldPath="coverImageUrl"
                  idFieldPath="coverImage"
                  type="image"
                />
              </Form.Item>
              <Form.Item name="coverImage" hidden>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Thumbnail"
                name="thumbnailUrl"
                tooltip="The card image on the blog index. Squarer, and cropped closer."
              >
                <UploadMedia
                  form={form}
                  fieldPath="thumbnailUrl"
                  idFieldPath="thumbnail"
                  type="image"
                />
              </Form.Item>
              <Form.Item name="thumbnail" hidden>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Search result">
          <p className="mb-4 text-xs text-secondary-500">
            What Google and a shared link show. Left blank, the site falls back
            to the title and the excerpt — which is usually right, so only fill
            these in when the headline needs different words out of context.
          </p>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Meta title"
                name="metaTitle"
                rules={[{ max: META_TITLE_MAX, message: `Under ${META_TITLE_MAX} characters` }]}
              >
                <Input showCount maxLength={META_TITLE_MAX} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Meta title (Bangla)"
                name="metaTitleBn"
                rules={[{ max: META_TITLE_MAX, message: `Under ${META_TITLE_MAX} characters` }]}
              >
                <Input showCount maxLength={META_TITLE_MAX} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Meta description"
                name="metaDescription"
                rules={[
                  { max: META_DESCRIPTION_MAX, message: `Under ${META_DESCRIPTION_MAX} characters` },
                ]}
              >
                <Input.TextArea
                  showCount
                  maxLength={META_DESCRIPTION_MAX}
                  autoSize={{ minRows: 2 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Meta description (Bangla)"
                name="metaDescriptionBn"
                rules={[
                  { max: META_DESCRIPTION_MAX, message: `Under ${META_DESCRIPTION_MAX} characters` },
                ]}
              >
                <Input.TextArea
                  showCount
                  maxLength={META_DESCRIPTION_MAX}
                  autoSize={{ minRows: 2 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Publishing">
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item label="Tags" name="tags">
                <Select mode="tags" placeholder="market, gulshan, legal" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                label="Status"
                name="status"
                tooltip="Nothing goes live by being saved."
              >
                <Select
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={6} md={4}>
              <Form.Item label="Featured" name="featured" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={6} md={4}>
              <Form.Item label="Trending" name="trending" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={6} md={4}>
              <Form.Item
                label="On home page"
                name="isHome"
                valuePropName="checked"
                tooltip="Nothing ticked and the home strip shows the newest instead."
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Actions Bottom Bar */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-lg border border-gray-300 shadow-md">
          <Button onClick={() => navigate("/blog")} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSaving}
            disabled={isSaving}
            size="large"
          >
            {isSaving ? "Saving..." : submitLabel}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default BlogForm;
