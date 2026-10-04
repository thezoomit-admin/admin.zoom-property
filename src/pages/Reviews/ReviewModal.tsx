import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Rate,
  Row,
  Segmented,
  Select,
  Switch,
} from "antd";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import UploadMedia from "../../components/shared/UploadMedia";
import { normalizeUrl, urlRule } from "../../utils/normalizeUrl";
import { useGetPropertiesQuery } from "../../redux/features/property/propertyApi";
import { useGetProjectsQuery } from "../../redux/features/project/projectApi";
import {
  useCreateReviewMutation,
  useUpdateReviewMutation,
} from "../../redux/features/review/reviewApi";

interface Props {
  open: boolean;
  onClose: () => void;
  review?: any;
}

type Format = "text" | "video";

/**
 * What each format is stored under, so switching away can clear it.
 *
 * Switching has to clear, not just hide. A review that was filmed and is now
 * written would otherwise keep its link in the database and carry on rendering
 * as a video on the site — the desk would see a text form and the visitor
 * would see a play button.
 */
const FORMAT_FIELDS: Record<Format, string[]> = {
  text: [],
  video: ["video"],
};

/** What the record already is. A link is the only thing that decides it. */
const formatOf = (review?: any): Format =>
  review?.video?.youtubeUrl ? "video" : "text";

/**
 * A client review, written or filmed.
 *
 * The two are genuinely different jobs, so the form changes rather than
 * showing sixteen boxes and letting the desk work out which eight matter:
 *
 *   Written  what somebody wrote. The quote is the review, so it gets the
 *            rating, the photograph, the role and the linked listing.
 *   Video    what somebody filmed. The recording is the review — a link, a
 *            still, the project it is about and a line of context. Nothing
 *            else is printed anywhere, so nothing else is asked for.
 *
 * Nothing here publishes it. A review goes up because somebody decided it
 * should, which is the switch on the list — so the form can be filled in by
 * whoever took the call without that being the same as putting it on the site.
 */
const ReviewModal = ({ open, onClose, review }: Props) => {
  const [form] = Form.useForm();
  const [propertySearch, setPropertySearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [format, setFormat] = useState<Format>("text");
  const [createReview, { isLoading: creating }] = useCreateReviewMutation();
  const [updateReview, { isLoading: updating }] = useUpdateReviewMutation();

  const isText = format === "text";
  const isVideo = !isText;
  /**
   * The format is set once, when the review is added.
   *
   * Switching it on an existing record is destructive in a way the form does
   * not show: the fields the other format does not use are cleared on save, so
   * turning a written review into a film would silently drop the quote, the
   * rating and the photograph somebody typed in. There is no undo, and the
   * only signal would be a shorter form.
   *
   * Delete and re-add is the honest path, and it is a deliberate act.
   */
  const locked = !!review;

  // The listings the "Property" box searches. `filterOption={false}` on the
  // Select, so the typing goes to the API rather than filtering the page.
  const { data: properties } = useGetPropertiesQuery({
    limit: 20,
    searchTerm: propertySearch || undefined,
  });

  const { data: projects } = useGetProjectsQuery({
    limit: 20,
    searchTerm: projectSearch || undefined,
  });

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFormat("text");
      return;
    }

    setFormat(formatOf(review));
    if (!review) return;

    form.setFieldsValue({
      ...review,
      property: review.property?._id ?? review.property,
      photo: review.photo?._id ?? review.photo,
      photoUrl: review.photo?.key,
      videoPoster: review.video?.poster?._id ?? review.video?.poster,
      videoPosterUrl: review.video?.poster?.key,
      video: {
        youtubeUrl: review.video?.youtubeUrl,
        duration: review.video?.duration,
      },
    });
  }, [open, review, form]);

  const onFinish = async (values: any) => {
    const { photoUrl, videoPosterUrl, videoPoster, ...rest } = values;
    void photoUrl;
    void videoPosterUrl;

    const body: Record<string, unknown> = {
      ...rest,
      // The site draws stars on every card. A film is published because
      // somebody chose to, so it carries full marks rather than none.
      rating: isText ? rest.rating : 5,
    };

    if (format === "video") {
      body.video = {
        ...(rest.video || {}),
        // Tidied the same way every other link on the panel is: a pasted embed
        // is reduced to its src, a bare host gains its scheme, blank stays blank.
        youtubeUrl: normalizeUrl(rest.video?.youtubeUrl),
        poster: videoPoster || null,
      };
    }

    // Clear whatever the other format owns, so the record says one thing.
    for (const [key, fields] of Object.entries(FORMAT_FIELDS)) {
      if (key === format) continue;
      for (const field of fields) body[field] = {};
    }

    if (isVideo) {
      // A film has no separate portrait: the still is the picture.
      body.photo = null;
      body.role = "";
      body.roleBn = "";
    } else {
      // The home strip is a row of players, so a written review can never be
      // on it. Forced rather than left to the disabled switch: switching a
      // filmed review to written would otherwise submit the flag it already
      // had, and the list would keep showing a "Home" tag on a quote that
      // cannot appear there.
      body.isHome = false;
    }

    try {
      const res: any = review
        ? await updateReview({ id: review._id, data: body }).unwrap()
        : await createReview(body).unwrap();
      toast.success(res?.message || "Saved");
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the review");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={review ? "Edit review" : "Add a review"}
      footer={null}
      width={720}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          rating: 5,
          isPublished: false,
          featured: false,
          isHome: false,
          order: 0,
        }}
      >
        <div className="mb-5 rounded-lg border border-secondary-100 bg-secondary-50/50 p-3">
          <Segmented
            block
            value={format}
            disabled={locked}
            onChange={(value) => setFormat(value as Format)}
            options={[
              { label: "Written", value: "text" },
              { label: "Video", value: "video" },
            ]}
          />
          <p className="mt-2 text-xs text-secondary-500">
            {locked
              ? isText
                ? "Written, and it stays written. Changing the format would throw away the quote, the rating and the photograph — delete it and add it again if it needs to be a film."
                : "Filmed, and it stays filmed. Changing the format would throw away the link and the still — delete it and add it again if it needs to be written."
              : isText
                ? "The quote is the review — it gets a rating, a photograph and a linked listing."
                : "The film is the review. Paste the link, add the project it is about and a line of context; nothing else is printed. Filmed reviews are what the home page shows."}
          </p>
        </div>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Client"
              name="clientName"
              rules={[{ required: true, message: "Who said it?" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          {isText ? (
            <>
              <Col xs={24} md={12}>
                <Form.Item label="What they do" name="role">
                  <Input placeholder="Consultant, Dhaka" />
                </Form.Item>
              </Col>
            </>
          ) : null}

          <Col xs={24}>
            <Form.Item
              label={isText ? "Quote" : "Short description"}
              name="quote"
              rules={[
                {
                  required: true,
                  message: isText
                    ? "The quote is the review"
                    : "One line of context for the recording",
                },
              ]}
              tooltip={
                isText
                  ? undefined
                  : "One or two sentences. It is what the card shows before anybody presses play, and the only version a search engine or a muted visitor reads."
              }
            >
              <Input.TextArea rows={isText ? 3 : 2} />
            </Form.Item>
          </Col>

          {isText ? (
            <>
              <Col xs={24} md={8}>
                <Form.Item label="Rating" name="rating">
                  <Rate />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Property"
                  name="property"
                  tooltip="Ties the quote to something real. Leave blank for older deals."
                >
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={setPropertySearch}
                    placeholder="Search listings"
                    options={(properties?.result || []).map((p: any) => ({
                      value: p._id,
                      label: `${p.referenceNo} · ${p.title}`,
                    }))}
                  />
                </Form.Item>
              </Col>
            </>
          ) : null}

          <Col xs={24} md={isVideo ? 24 : 16}>
            <Form.Item
              label={isVideo ? "Project name" : "Property, in words"}
              name="propertyLabel"
              tooltip={
                isVideo
                  ? "The project or address the film is about. Printed under the name."
                  : "For deals that closed before this system, or that the client would rather not have linked."
              }
            >
              {isVideo ? (
                <Select
                  allowClear
                  showSearch
                  filterOption={false}
                  onSearch={setProjectSearch}
                  placeholder="Search projects"
                  options={(projects?.result || []).map((p: any) => ({
                    value: p.name,
                    label: p.name,
                  }))}
                />
              ) : (
                <Input placeholder="" />
              )}
            </Form.Item>
          </Col>

          {isText ? (
            <Col xs={24} md={8}>
              <Form.Item label="Photo" name="photoUrl">
                <UploadMedia
                  form={form}
                  fieldPath="photoUrl"
                  idFieldPath="photo"
                  type="image"
                />
              </Form.Item>
              <Form.Item name="photo" hidden>
                <Input />
              </Form.Item>
            </Col>
          ) : null}

          {format === "video" ? (
            <Col xs={24}>
              <Row gutter={12}>
                <Col xs={24} md={16}>
                  <Form.Item
                    label="Video link"
                    name={["video", "youtubeUrl"]}
                    rules={[
                      { required: true, message: "The film is the review" },
                      urlRule,
                    ]}
                  >
                    <Input placeholder="https://youtube.com/watch?v=…" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Duration"
                    name={["video", "duration"]}
                    tooltip="Shown in the corner of the tile."
                  >
                    <Input placeholder="1:24" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Still"
                    name="videoPosterUrl"
                    tooltip="A frame of the person talking. Left empty, the player's own first frame is used."
                  >
                    <UploadMedia
                      form={form}
                      fieldPath="videoPosterUrl"
                      idFieldPath="videoPoster"
                      type="image"
                    />
                  </Form.Item>
                  <Form.Item name="videoPoster" hidden>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          ) : null}

          <Col xs={12} md={isVideo ? 8 : 12}>
            <Form.Item label="Featured" name="featured" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>

          {/* Only filmed reviews can be on the home page, so a written one is
              not offered the choice. A control that is always disabled reads
              as something broken; leaving it out says the same thing without
              asking anybody to hover a tooltip to find out why. */}
          {isVideo ? (
            <Col xs={12} md={8}>
              <Form.Item
                label="On home page"
                name="isHome"
                valuePropName="checked"
                tooltip="Nothing ticked and the strip shows the newest films instead."
              >
                <Switch />
              </Form.Item>
            </Col>
          ) : null}

          <Col xs={12} md={isVideo ? 8 : 12}>
            <Form.Item label="Order" name="order">
              <InputNumber className="!w-full" />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={creating || updating}>
            {review ? "Save changes" : "Add review"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ReviewModal;
