"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CustomTextConfig, DesignConfiguration, Garment, PriceBreakdown, PriceRequestPayload } from "@/types/api";
import type { CustomizerOptions } from "@/types/api";
import * as customizerService from "@/services/customizer";
import * as designsService from "@/services/designs";
import { CUSTOMIZER_FONTS, CUSTOMIZER_STEPS, NOTES_MAX_LENGTH, resolvePositionCoords } from "@/config/customizer";
import type { MeasurementValues } from "@/config/customizer";
import { CustomizerStepper } from "@/components/customizer/CustomizerStepper";
import { GarmentPreview } from "@/components/customizer/GarmentPreview";
import { TextEditor } from "@/components/customizer/TextEditor";
import { LogoUploader, type LogoState } from "@/components/customizer/LogoUploader";
import { MeasurementForm } from "@/components/customizer/MeasurementForm";
import { PriceSummary } from "@/components/customizer/PriceSummary";
import { ColorSwatchGroup } from "@/components/product/ColorSwatch";
import { SizeSelector } from "@/components/product/SizeSelector";
import { FabricSelector } from "@/components/product/FabricSelector";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/http";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

const DRAFT_STORAGE_KEY = "ccp_customizer_draft";
const NEXT_PATH = "/customize";

interface CustomizerDraft {
  garmentId: number | null;
  fabricId: number | null;
  colorId: number | null;
  sizeId: number | null;
  fitStyle: string;
  text: CustomTextConfig;
  printPositionId: number | null;
  embroideryPositionId: number | null;
  embroideryThreadColor: string;
  patchIds: number[];
  measurements: MeasurementValues;
  notes: string;
  quantity: number;
  designName: string;
  logoUploadedUrl: string | null;
  logoPreviewUrl: string | null;
}

const DEFAULT_TEXT: CustomTextConfig = {
  content: "",
  font: CUSTOMIZER_FONTS[0].family,
  size: 28,
  color: "#171717",
  bold: false,
  italic: false,
  align: "center",
  rotation: 0,
};

const FIT_STYLES = ["Regular Fit", "Slim Fit", "Oversized"];

export function CustomizerWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [garments, setGarments] = useState<Garment[] | null>(null);
  const [options, setOptions] = useState<CustomizerOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);

  const [garmentId, setGarmentId] = useState<number | null>(null);
  const [fabricId, setFabricId] = useState<number | null>(null);
  const [colorId, setColorId] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [fitStyle, setFitStyle] = useState<string>(FIT_STYLES[0]);
  const [logo, setLogo] = useState<LogoState>({ previewUrl: null, uploadedUrl: null, isUploading: false, error: null });
  const [text, setText] = useState<CustomTextConfig>(DEFAULT_TEXT);
  const [printPositionId, setPrintPositionId] = useState<number | null>(null);
  const [embroideryPositionId, setEmbroideryPositionId] = useState<number | null>(null);
  const [embroideryThreadColor, setEmbroideryThreadColor] = useState("#171717");
  const [patchIds, setPatchIds] = useState<number[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementValues>({});
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [designName, setDesignName] = useState("");

  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // ---- initial data + draft restore -------------------------------------
  useEffect(() => {
    Promise.all([customizerService.getGarments(), customizerService.getCustomizerOptions()])
      .then(([g, o]) => {
        setGarments(g);
        setOptions(o);
        const garmentSlug = searchParams.get("garment");
        if (garmentSlug) {
          const match = g.find((item) => item.slug === garmentSlug);
          if (match) setGarmentId((prev) => prev ?? match.id);
        }
      })
      .catch((err) => setLoadError(getErrorMessage(err, "Unable to load customizer options right now.")));

    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as CustomizerDraft;
        setGarmentId(draft.garmentId);
        setFabricId(draft.fabricId);
        setColorId(draft.colorId);
        setSizeId(draft.sizeId);
        setFitStyle(draft.fitStyle ?? FIT_STYLES[0]);
        setText(draft.text ?? DEFAULT_TEXT);
        setPrintPositionId(draft.printPositionId);
        setEmbroideryPositionId(draft.embroideryPositionId);
        setEmbroideryThreadColor(draft.embroideryThreadColor ?? "#171717");
        setPatchIds(draft.patchIds ?? []);
        setMeasurements(draft.measurements ?? {});
        setNotes(draft.notes ?? "");
        setQuantity(draft.quantity ?? 1);
        setDesignName(draft.designName ?? "");
        if (draft.logoUploadedUrl || draft.logoPreviewUrl) {
          setLogo({ previewUrl: draft.logoPreviewUrl, uploadedUrl: draft.logoUploadedUrl, isUploading: false, error: null });
        }
        setFurthestIndex(CUSTOMIZER_STEPS.length - 1);
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftRestored(true);
      }
    } catch {
      /* ignore malformed draft */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistDraft() {
    const draft: CustomizerDraft = {
      garmentId,
      fabricId,
      colorId,
      sizeId,
      fitStyle,
      text,
      printPositionId,
      embroideryPositionId,
      embroideryThreadColor,
      patchIds,
      measurements,
      notes,
      quantity,
      designName,
      logoUploadedUrl: logo.uploadedUrl,
      logoPreviewUrl: logo.previewUrl,
    };
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable */
    }
  }

  // ---- derived values -----------------------------------------------------
  const selectedGarment = useMemo(() => garments?.find((g) => g.id === garmentId) ?? null, [garments, garmentId]);
  const availableColors = selectedGarment?.available_colors?.length ? selectedGarment.available_colors : options?.colors ?? [];
  const availableSizes = selectedGarment?.available_sizes?.length ? selectedGarment.available_sizes : options?.sizes ?? [];
  const colorHex = availableColors.find((c) => c.id === colorId)?.hex || "#d9d3c7";

  const printPosition = options?.print_positions.find((p) => p.id === printPositionId) ?? null;
  const embroideryPosition = options?.embroidery_positions.find((p) => p.id === embroideryPositionId) ?? null;
  const selectedPatches = options?.patches.filter((p) => patchIds.includes(p.id)) ?? [];

  const pricePayload: PriceRequestPayload | null = garmentId
    ? {
        garment_id: garmentId,
        fabric_id: fabricId,
        color_id: colorId,
        size_id: sizeId,
        logo: Boolean(logo.uploadedUrl),
        text: text.content.trim() ? text : null,
        print: printPositionId ? { position_id: printPositionId } : null,
        embroidery: embroideryPositionId ? { position_id: embroideryPositionId } : null,
        patch_ids: patchIds,
        quantity,
      }
    : null;

  // ---- live price calculation ----------------------------------------------
  useEffect(() => {
    if (!pricePayload) {
      setPrice(null);
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    const timeout = setTimeout(() => {
      customizerService
        .getCustomizerPrice(pricePayload)
        .then((result) => {
          if (!cancelled) {
            setPrice(result);
            setPriceError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setPrice(null);
            setPriceError(getErrorMessage(err, "Unable to calculate price right now."));
          }
        })
        .finally(() => !cancelled && setPriceLoading(false));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pricePayload)]);

  // ---- navigation -----------------------------------------------------------
  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(CUSTOMIZER_STEPS.length - 1, index));
      setStepIndex(clamped);
      setFurthestIndex((prev) => Math.max(prev, clamped));
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  function buildConfiguration(): DesignConfiguration {
    return {
      ...(pricePayload as PriceRequestPayload),
      logo_url: logo.uploadedUrl,
      embroidery_thread_color: embroideryPositionId ? embroideryThreadColor : null,
      notes: fitStyle ? `Fit style: ${fitStyle}. ${notes}`.trim() : notes,
      measurements,
    };
  }

  function capturePreviewImage(): string | undefined {
    try {
      return canvasRef.current?.toDataURL("image/png");
    } catch {
      // Canvas may be tainted if a remote garment/logo image lacks CORS
      // headers — degrade gracefully rather than failing the save.
      return undefined;
    }
  }

  async function handleSaveDesign() {
    if (!pricePayload) return;
    if (!isAuthenticated) {
      persistDraft();
      router.push(`/login?next=${encodeURIComponent(NEXT_PATH)}`);
      return;
    }
    setIsSaving(true);
    try {
      await designsService.saveDesign({
        name: designName.trim() || `${selectedGarment?.name || "Custom garment"} design`,
        configuration: buildConfiguration(),
        preview_image_url: capturePreviewImage(),
      });
      showToast({ title: "Design saved", description: "Find it under My Account → Saved Designs.", variant: "success" });
    } catch (err) {
      showToast({ title: "Couldn't save design", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddToCart() {
    if (!pricePayload || !price) return;
    setIsAddingToCart(true);
    try {
      await addItem({ type: "custom", design_configuration: buildConfiguration(), quantity });
      showToast({ title: "Added to cart", description: "Your custom design is in your cart.", variant: "success" });
    } catch (err) {
      showToast({ title: "Couldn't add to cart", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsAddingToCart(false);
    }
  }

  function handleReset() {
    setGarmentId(null);
    setFabricId(null);
    setColorId(null);
    setSizeId(null);
    setFitStyle(FIT_STYLES[0]);
    setLogo({ previewUrl: null, uploadedUrl: null, isUploading: false, error: null });
    setText(DEFAULT_TEXT);
    setPrintPositionId(null);
    setEmbroideryPositionId(null);
    setEmbroideryThreadColor("#171717");
    setPatchIds([]);
    setMeasurements({});
    setNotes("");
    setQuantity(1);
    setDesignName("");
    setStepIndex(0);
    setFurthestIndex(0);
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">Customizer unavailable</h1>
        <p className="mt-3 text-neutral-600">{loadError}</p>
      </div>
    );
  }

  const currentStep = CUSTOMIZER_STEPS[stepIndex];
  const isLastStep = stepIndex === CUSTOMIZER_STEPS.length - 1;
  const canProceed = currentStep.optional || isStepSatisfied(currentStep.id, { garmentId, fabricId, colorId, sizeId });

  const previewNode = (
    <div className="space-y-4">
      <GarmentPreview
        ref={canvasRef}
        garmentImageUrl={selectedGarment?.image_layers.base}
        garmentName={selectedGarment?.name}
        colorHex={colorHex}
        logoUrl={logo.uploadedUrl || logo.previewUrl}
        logoPosition={printPosition ? resolvePositionCoords(printPosition.label) : undefined}
        text={text}
        printLabel={printPosition?.label}
        printPosition={printPosition ? resolvePositionCoords(printPosition.label) : undefined}
        embroidery={
          embroideryPosition
            ? { label: embroideryPosition.label, threadColor: embroideryThreadColor, position: resolvePositionCoords(embroideryPosition.label) }
            : undefined
        }
        patches={selectedPatches}
      />
      <PriceSummary price={price} isLoading={priceLoading} error={priceError} />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Customize Your Garment</h1>
        <p className="mt-1 text-sm text-neutral-500">{currentStep.description}</p>
        {draftRestored && <p className="mt-1 text-xs text-emerald-700">Your in-progress design was restored.</p>}
      </div>

      {/* Mobile: preview shown above the step content for a genuinely usable flow. */}
      <div className="mb-6 lg:hidden">{previewNode}</div>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr_360px]">
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <CustomizerStepper steps={CUSTOMIZER_STEPS} currentIndex={stepIndex} furthestIndex={furthestIndex} onSelect={goToStep} />
        </div>

        <div className="min-w-0">
          <div className="rounded-xl border border-neutral-200 p-5 sm:p-6">
            <StepContent
              step={currentStep.id}
              garments={garments}
              options={options}
              garmentId={garmentId}
              setGarmentId={setGarmentId}
              fabricId={fabricId}
              setFabricId={setFabricId}
              colorId={colorId}
              setColorId={setColorId}
              availableColors={availableColors}
              sizeId={sizeId}
              setSizeId={setSizeId}
              availableSizes={availableSizes}
              fitStyle={fitStyle}
              setFitStyle={setFitStyle}
              logo={logo}
              setLogo={setLogo}
              text={text}
              setText={setText}
              printPositionId={printPositionId}
              setPrintPositionId={setPrintPositionId}
              embroideryPositionId={embroideryPositionId}
              setEmbroideryPositionId={setEmbroideryPositionId}
              embroideryThreadColor={embroideryThreadColor}
              setEmbroideryThreadColor={setEmbroideryThreadColor}
              patchIds={patchIds}
              setPatchIds={setPatchIds}
              measurements={measurements}
              setMeasurements={setMeasurements}
              notes={notes}
              setNotes={setNotes}
              quantity={quantity}
              setQuantity={setQuantity}
              designName={designName}
              setDesignName={setDesignName}
              price={price}
              isAuthenticated={isAuthenticated}
            />
          </div>

          <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-neutral-200 bg-white py-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-medium text-neutral-500 underline hover:text-neutral-900"
            >
              Reset
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => goToStep(stepIndex - 1)}
                disabled={stepIndex === 0}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-40"
              >
                Back
              </button>
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => goToStep(stepIndex + 1)}
                  disabled={!canProceed}
                  className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
                >
                  Next
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDesign}
                    disabled={isSaving || !pricePayload}
                    className="rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-40"
                  >
                    {isSaving ? "Saving…" : "Save Design"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !pricePayload || !price}
                    className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
                  >
                    {isAddingToCart ? "Adding…" : price ? `Add to Cart · ${formatMoney(price.total_minor, price.currency)}` : "Add to Cart"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20">{previewNode}</div>
        </div>
      </div>
    </div>
  );
}

function isStepSatisfied(
  stepId: string,
  state: { garmentId: number | null; fabricId: number | null; colorId: number | null; sizeId: number | null }
): boolean {
  switch (stepId) {
    case "garment":
      return state.garmentId !== null;
    case "fabric":
      return state.fabricId !== null;
    case "color":
      return state.colorId !== null;
    case "size":
      return state.sizeId !== null;
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Step content
// ---------------------------------------------------------------------------

interface StepContentProps {
  step: string;
  garments: Garment[] | null;
  options: CustomizerOptions | null;
  garmentId: number | null;
  setGarmentId: (id: number) => void;
  fabricId: number | null;
  setFabricId: (id: number) => void;
  colorId: number | null;
  setColorId: (id: number) => void;
  availableColors: Array<{ id: number; name: string; hex: string }>;
  sizeId: number | null;
  setSizeId: (id: number) => void;
  availableSizes: Array<{ id: number; label: string }>;
  fitStyle: string;
  setFitStyle: (v: string) => void;
  logo: LogoState;
  setLogo: (v: LogoState) => void;
  text: CustomTextConfig;
  setText: (v: CustomTextConfig) => void;
  printPositionId: number | null;
  setPrintPositionId: (id: number | null) => void;
  embroideryPositionId: number | null;
  setEmbroideryPositionId: (id: number | null) => void;
  embroideryThreadColor: string;
  setEmbroideryThreadColor: (v: string) => void;
  patchIds: number[];
  setPatchIds: (ids: number[]) => void;
  measurements: MeasurementValues;
  setMeasurements: (v: MeasurementValues) => void;
  notes: string;
  setNotes: (v: string) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  designName: string;
  setDesignName: (v: string) => void;
  price: PriceBreakdown | null;
  isAuthenticated: boolean;
}

function StepContent(props: StepContentProps) {
  switch (props.step) {
    case "garment":
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(props.garments ?? []).map((garment) => (
            <button
              key={garment.id}
              type="button"
              onClick={() => props.setGarmentId(garment.id)}
              aria-pressed={props.garmentId === garment.id}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-colors",
                props.garmentId === garment.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"
              )}
            >
              <p className="text-sm font-semibold text-neutral-900">{garment.name}</p>
              <p className="mt-1 text-xs text-neutral-500">from {formatMoney(garment.base_price_minor)}</p>
            </button>
          ))}
          {props.garments === null && <p className="text-sm text-neutral-500">Loading garments…</p>}
          {props.garments?.length === 0 && <p className="text-sm text-neutral-500">No garments available right now.</p>}
        </div>
      );
    case "fabric":
      return props.options ? (
        <FabricSelector fabrics={props.options.fabrics} selectedId={props.fabricId} onChange={props.setFabricId} />
      ) : (
        <p className="text-sm text-neutral-500">Loading fabrics…</p>
      );
    case "color":
      return <ColorSwatchGroup colors={props.availableColors} selectedId={props.colorId} onChange={props.setColorId} />;
    case "size":
      return <SizeSelector sizes={props.availableSizes} selectedId={props.sizeId} onChange={props.setSizeId} />;
    case "style":
      return (
        <div className="flex flex-wrap gap-2">
          {FIT_STYLES.map((fit) => (
            <button
              key={fit}
              type="button"
              onClick={() => props.setFitStyle(fit)}
              aria-pressed={props.fitStyle === fit}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-medium",
                props.fitStyle === fit ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700"
              )}
            >
              {fit}
            </button>
          ))}
        </div>
      );
    case "logo":
      return <LogoUploader state={props.logo} onChange={props.setLogo} />;
    case "text":
      return <TextEditor value={props.text} onChange={props.setText} />;
    case "print":
      return props.options ? (
        <PositionPicker
          positions={props.options.print_positions}
          selectedId={props.printPositionId}
          onChange={props.setPrintPositionId}
        />
      ) : (
        <p className="text-sm text-neutral-500">Loading placement options…</p>
      );
    case "embroidery":
      return props.options ? (
        <div className="space-y-4">
          <PositionPicker
            positions={props.options.embroidery_positions}
            selectedId={props.embroideryPositionId}
            onChange={props.setEmbroideryPositionId}
          />
          {props.embroideryPositionId !== null && (
            <div>
              <label htmlFor="thread-color" className="mb-1 block text-sm font-medium text-neutral-900">
                Thread color
              </label>
              <input
                id="thread-color"
                type="color"
                value={props.embroideryThreadColor}
                onChange={(e) => props.setEmbroideryThreadColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-neutral-300"
              />
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Loading embroidery options…</p>
      );
    case "patches":
      return props.options ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {props.options.patches.map((patch) => {
            const checked = props.patchIds.includes(patch.id);
            return (
              <label
                key={patch.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm",
                  checked ? "border-neutral-900 bg-neutral-50" : "border-neutral-300"
                )}
              >
                <span>
                  {patch.name}
                  <span className="ml-1 text-xs text-neutral-400">({patch.type})</span>
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    props.setPatchIds(e.target.checked ? [...props.patchIds, patch.id] : props.patchIds.filter((id) => id !== patch.id))
                  }
                  className="h-4 w-4"
                />
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Loading patches…</p>
      );
    case "measurements":
      return <MeasurementForm values={props.measurements} onChange={props.setMeasurements} />;
    case "notes":
      return (
        <div>
          <label htmlFor="customizer-notes" className="mb-1 block text-sm font-medium text-neutral-900">
            Anything else our production team should know?
          </label>
          <textarea
            id="customizer-notes"
            value={props.notes}
            maxLength={NOTES_MAX_LENGTH}
            onChange={(e) => props.setNotes(e.target.value)}
            rows={5}
            placeholder="e.g. Please center the logo slightly higher than default, use matte thread, etc."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
          <p className="mt-1 text-right text-xs text-neutral-400">
            {props.notes.length}/{NOTES_MAX_LENGTH}
          </p>
        </div>
      );
    case "review":
      return (
        <div className="space-y-5">
          <div>
            <label htmlFor="design-name" className="mb-1 block text-sm font-medium text-neutral-900">
              Design name
            </label>
            <input
              id="design-name"
              type="text"
              value={props.designName}
              onChange={(e) => props.setDesignName(e.target.value)}
              placeholder="e.g. My Team Hoodie"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
          </div>
          <div>
            <label htmlFor="design-quantity" className="mb-1 block text-sm font-medium text-neutral-900">
              Quantity
            </label>
            <input
              id="design-quantity"
              type="number"
              min={1}
              value={props.quantity}
              onChange={(e) => props.setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
          </div>
          {!props.isAuthenticated && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              You&apos;ll need to sign in to save this design — your progress will be kept.
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
}

function PositionPicker({
  positions,
  selectedId,
  onChange,
}: {
  positions: Array<{ id: number; label: string; price_minor: number }>;
  selectedId: number | null;
  onChange: (id: number | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={selectedId === null}
        className={cn(
          "rounded-lg border px-3 py-2.5 text-sm",
          selectedId === null ? "border-neutral-900 bg-neutral-50" : "border-neutral-300 text-neutral-600"
        )}
      >
        None
      </button>
      {positions.map((position) => (
        <button
          key={position.id}
          type="button"
          onClick={() => onChange(position.id)}
          aria-pressed={selectedId === position.id}
          className={cn(
            "flex flex-col items-start rounded-lg border px-3 py-2.5 text-left text-sm",
            selectedId === position.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-300"
          )}
        >
          <span className="font-medium text-neutral-900">{position.label}</span>
          {position.price_minor > 0 && <span className="text-xs text-neutral-500">+{formatMoney(position.price_minor)}</span>}
        </button>
      ))}
    </div>
  );
}
