"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

// A JSON value shaped by the ProposalContent Zod schema: string, boolean,
// or a nested object/array of those. There's no dynamic keying (schemas are
// fixed per section), so recursing over unknown JSON is safe and much less
// code than nine bespoke forms — we intentionally don't support adding or
// removing array items here, since the schema pins each array's length and
// the AI already generates the right count.
export type JsonValue = string | boolean | JsonValue[] | { [key: string]: JsonValue };

function setPath(root: JsonValue, path: (string | number)[], value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (typeof head === "number") {
    const arr = Array.isArray(root) ? [...root] : [];
    arr[head] = setPath(arr[head] ?? {}, rest, value);
    return arr;
  }
  const obj = typeof root === "object" && root !== null && !Array.isArray(root) ? { ...root } : {};
  return { ...obj, [head]: setPath((obj as Record<string, JsonValue>)[head] ?? "", rest, value) };
}

export function updateJsonPath(root: JsonValue, path: (string | number)[], value: JsonValue): JsonValue {
  return setPath(root, path, value);
}

function Field({
  label,
  path,
  value,
  onChange,
}: {
  label: string;
  path: (string | number)[];
  value: JsonValue;
  onChange: (path: (string | number)[], value: JsonValue) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Select value={value ? "yes" : "no"} onValueChange={(v) => onChange(path, v === "yes")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (typeof value === "string") {
    const long = value.length > 60;
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        {long ? (
          <Textarea
            value={value}
            rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60)))}
            onChange={(e) => onChange(path, e.target.value)}
          />
        ) : (
          <Input value={value} onChange={(e) => onChange(path, e.target.value)} />
        )}
      </div>
    );
  }

  if (Array.isArray(value)) {
    // Array of strings vs array of objects
    const isStringArray = value.every((item) => typeof item === "string");
    if (isStringArray) {
      return (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <div className="space-y-2">
            {value.map((item, index) => (
              <Input
                key={index}
                value={item as string}
                onChange={(e) => onChange([...path, index], e.target.value)}
              />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="space-y-3">
          {value.map((item, index) => (
            <div key={index} className="rounded-md border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {label} {index + 1}
              </p>
              <ObjectFields path={[...path, index]} value={item} onChange={onChange} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <ObjectFields path={path} value={value} onChange={onChange} />;
}

function ObjectFields({
  path,
  value,
  onChange,
}: {
  path: (string | number)[];
  value: JsonValue;
  onChange: (path: (string | number)[], value: JsonValue) => void;
}) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return (
    <div className="space-y-3">
      {Object.entries(value).map(([key, val]) => (
        <Field key={key} label={humanize(key)} path={[...path, key]} value={val} onChange={onChange} />
      ))}
    </div>
  );
}

export function SectionEditor({
  value,
  onChange,
}: {
  value: JsonValue;
  onChange: (next: JsonValue) => void;
}) {
  function handleFieldChange(path: (string | number)[], fieldValue: JsonValue) {
    onChange(updateJsonPath(value, path, fieldValue));
  }

  return (
    <div className="space-y-4">
      <ObjectFields path={[]} value={value} onChange={handleFieldChange} />
      <Separator className="hidden" />
    </div>
  );
}
