import { FileTextIcon, UploadIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import SetMediaModal from "../modal/media/SetMediaModal";
import AntImage from "./AntImage";
import { Form } from "antd";
import { config } from "../../config";
import { mediaSrc } from "../../utils/mediaSrc";

interface UploadImageProps {
  form: any;
  fieldPath: string | (string | number)[];
  idFieldPath?: string | (string | number)[];
  mode?: "single" | "multiple";
  /**
   * What kind of file this slot holds. "document" switches the picker to PDFs
   * and other handouts — without it a syllabus PDF can never be attached,
   * because the media picker only ever offered images.
   */
  mediaKind?: "image" | "document";
}

/** Holds Form values without coercing arrays through <Input>. */
const ValueHolder = ({ value: _value }: { value?: unknown; onChange?: (v: unknown) => void }) =>
  null;

const toPath = (path: string | (string | number)[]) =>
  Array.isArray(path)
    ? path
    : path.split(".").map((key) => (/^\d+$/.test(key) ? Number(key) : key));

const previewUrl = (raw: unknown, data?: any): string => {
  if (data?.url) return mediaSrc(data.url) || mediaSrc(data.path || data.key) || "";
  if (typeof raw === "string" && raw.trim()) return mediaSrc(raw);
  if (data?.path || data?.key) return mediaSrc(data.path || data.key);
  return "";
};

const mediaObjectId = (data: any): string | undefined => {
  const id = data?._id || data?.id;
  return id != null ? String(id) : undefined;
};

const UploadImage = ({
  form,
  fieldPath,
  idFieldPath,
  mode = "single",
  mediaKind = "image",
}: UploadImageProps) => {
  const [openSetImageModal, setOpenSetImageModal] = useState(false);
  const isDoc = mediaKind === "document";
  const uploadLabel = isDoc ? "Upload File" : "Upload Image";

  const pathArray = useMemo(() => toPath(fieldPath), [fieldPath]);
  const idPathArray = useMemo(
    () => (idFieldPath ? toPath(idFieldPath) : null),
    [idFieldPath],
  );

  const fieldValue = Form.useWatch(pathArray, form);

  const imageUrls =
    mode === "multiple"
      ? (Array.isArray(fieldValue)
          ? fieldValue
          : fieldValue
            ? [fieldValue]
            : []
        ).filter((u): u is string => typeof u === "string" && !!u.trim())
      : fieldValue;

  const handleDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    url?: string
  ) => {
    e.preventDefault();
    if (mode === "multiple") {
      const index = imageUrls.indexOf(url);
      if (index !== -1) {
        const updated = [...imageUrls];
        updated.splice(index, 1);
        form.setFieldValue(pathArray, updated);

        if (idPathArray) {
          const currentIds = form.getFieldValue(idPathArray) || [];
          if (Array.isArray(currentIds) && currentIds.length > index) {
            const updatedIds = [...currentIds];
            updatedIds.splice(index, 1);
            form.setFieldValue(idPathArray, updatedIds);
          }
        }
      }
    } else {
      form.setFieldValue(pathArray, null);
      if (idPathArray) {
        form.setFieldValue(idPathArray, null);
      }
    }
  };

  const handleImageSelect = (selected: string | string[], selectedData?: any) => {
    if (mode === "multiple") {
      const items = Array.isArray(selectedData)
        ? selectedData
        : selectedData
          ? [selectedData]
          : [];
      const rawUrls = Array.isArray(selected) ? selected : [selected];

      const pairs = rawUrls
        .map((raw, idx) => ({
          url: previewUrl(raw, items[idx]),
          id: mediaObjectId(items[idx]),
        }))
        .filter((p) => p.url);

      const existing = imageUrls || [];
      const urlsToAdd = pairs.filter((p) => !existing.includes(p.url));
      if (urlsToAdd.length === 0) {
        setOpenSetImageModal(false);
        return;
      }

      form.setFieldValue(pathArray, [...existing, ...urlsToAdd.map((p) => p.url)]);

      if (idPathArray) {
        const currentIds = form.getFieldValue(idPathArray) || [];
        const idsToAdd = urlsToAdd.map((p) => p.id).filter(Boolean);
        form.setFieldValue(idPathArray, [
          ...(Array.isArray(currentIds) ? currentIds : []),
          ...idsToAdd,
        ]);
      }
    } else {
      const data = Array.isArray(selectedData) ? selectedData[0] : selectedData;
      const url = previewUrl(
        Array.isArray(selected) ? selected[0] : selected,
        data,
      );
      form.setFieldValue(pathArray, url || null);

      if (idPathArray) {
        form.setFieldValue(idPathArray, mediaObjectId(data) || null);
      }
    }
    setOpenSetImageModal(false);
  };

  // A PDF has no thumbnail, so its tile is the file name plus a link that
  // opens it — the same click that would have previewed an image.
  const DocTile = ({ url }: { url: string }) => {
    const href = url?.startsWith("http")
      ? url
      : `${config.image_access_url}/${url}`;
    const name = decodeURIComponent(String(url).split("/").pop() || "file");
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={name}
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border border-gray-200 bg-gray-50 p-2 text-gray-500 hover:border-primary-400"
      >
        <FileTextIcon className="h-7 w-7" />
        <span className="w-full truncate text-center text-[10px]">{name}</span>
      </a>
    );
  };

  return (
    <div className="space-y-2">
      <Form.Item name={pathArray} hidden>
        <ValueHolder />
      </Form.Item>
      {idPathArray && (
        <Form.Item name={idPathArray} hidden>
          <ValueHolder />
        </Form.Item>
      )}
      {/* Single mode */}
      {mode === "single" ? (
        imageUrls ? (
          <div
            className="relative w-[125px] h-[125px] cursor-pointer"
          >
            {isDoc ? (
              <DocTile url={imageUrls} />
            ) : (
              <AntImage
                width={125}
                height={125}
                src={imageUrls}
                accessurl={!String(imageUrls).startsWith("http")}
                alt="Preview"
                className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm"
              />
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="absolute top-1 right-1 bg-white border border-red-500 text-red-600 p-2 rounded-lg shadow hover:bg-red-600 hover:text-white transition-colors"
            >
              <RiDeleteBinLine size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpenSetImageModal(true)}
            className="flex flex-col items-center justify-center w-32 h-32 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-primary-400 transition-colors duration-200 cursor-pointer"
          >
            <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500 text-center">
              {uploadLabel}
            </span>
          </button>
        )
      ) : (
        // Multiple mode
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url: string, index: number) => (
            <div key={`${url}-${index}`} className="relative w-[120px] h-[120px]">
              {isDoc ? (
                <DocTile url={url} />
              ) : (
                <AntImage
                  width={120}
                  height={120}
                  src={url}
                  accessurl={!url?.startsWith("http")}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm"
                />
              )}
              <button
                type="button"
                onClick={(e) => handleDelete(e, url)}
                className="absolute top-1 right-1 bg-white border border-red-500 text-red-600 p-2 rounded-lg shadow hover:bg-red-600 hover:text-white transition-colors"
              >
                <RiDeleteBinLine size={16} />
              </button>
            </div>
          ))}

          {/* Always show Upload button in multiple mode */}
          <button
            type="button"
            onClick={() => setOpenSetImageModal(true)}
            className="flex flex-col items-center justify-center w-32 h-32 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-primary-400 transition-colors duration-200 cursor-pointer"
          >
            <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500 text-center">
              {uploadLabel}
            </span>
          </button>
        </div>
      )}

      {openSetImageModal && (
        <SetMediaModal
          open={openSetImageModal}
          setOpen={setOpenSetImageModal}
          onSelectImage={handleImageSelect}
          selectionMode={mode}
          initialSelected={mode === "multiple" ? imageUrls : undefined}
          type={mediaKind}
        />
      )}
    </div>
  );
};

export default UploadImage;
