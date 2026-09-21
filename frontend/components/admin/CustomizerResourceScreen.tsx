"use client";

import type { ReactNode } from "react";
import { ResourceListPage, type ResourceColumn } from "@/components/admin/ResourceListPage";
import { GenericConfigForm, type FieldSpec } from "@/components/admin/GenericConfigForm";

export interface CustomizerResourceService<T, TPayload = unknown> {
  list: () => Promise<T[]>;
  create: (payload: TPayload) => Promise<T>;
  update: (id: number, payload: TPayload) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
}

/**
 * Renders one of the six admin "customizer option" screens on top of the
 * shared ResourceListPage shell + GenericConfigForm field renderer — see
 * app/admin/customizer/*\/page.tsx for the (short) per-resource config.
 */
export function CustomizerResourceScreen<T extends { id: number }, TPayload = unknown>({
  title,
  singularLabel,
  description,
  newButtonLabel,
  service,
  fields,
  columns,
  toInitialValues,
  buildPayload,
  getName,
  emptyDescription,
}: {
  title: string;
  singularLabel: string;
  description?: string;
  newButtonLabel: string;
  service: CustomizerResourceService<T, TPayload>;
  fields: FieldSpec[];
  columns: ResourceColumn<T>[];
  toInitialValues: (item?: T) => Record<string, unknown>;
  buildPayload: (values: Record<string, unknown>) => TPayload;
  getName: (item: T) => string;
  emptyDescription?: string;
}) {
  return (
    <ResourceListPage<T>
      title={title}
      singularLabel={singularLabel}
      description={description}
      newButtonLabel={newButtonLabel}
      getId={(item) => item.id}
      getName={getName}
      fetchAll={service.list}
      createItem={(payload) => service.create(payload as TPayload)}
      updateItem={(id, payload) => service.update(id, payload as TPayload)}
      deleteItem={service.remove}
      emptyTitle={`No ${title.toLowerCase()} yet`}
      emptyDescription={emptyDescription}
      columns={columns}
      renderForm={({ initial, onSubmit, isSubmitting, fieldErrors }): ReactNode => (
        <GenericConfigForm
          fields={fields}
          initialValues={toInitialValues(initial)}
          onSubmit={(values) => onSubmit(buildPayload(values))}
          isSubmitting={isSubmitting}
          fieldErrors={fieldErrors}
          submitLabel={`Save ${singularLabel}`}
        />
      )}
    />
  );
}
