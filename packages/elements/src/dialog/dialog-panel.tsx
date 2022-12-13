import {
  callHandler,
  createPolymorphicComponent,
  mergeDefaultProps,
  mergeRefs,
} from "@kobalte/utils";
import { createEffect, JSX, onCleanup, Show, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { createFocusTrapRegion, createOverlay } from "../primitives";
import { useDialogContext, useDialogPortalContext } from "./dialog-context";

export interface DialogPanelProps {
  /**
   * Used to force mounting when more control is needed.
   * Useful when controlling animation with SolidJS animation libraries.
   * It inherits from `Dialog.Portal`.
   */
  forceMount?: boolean;
}

/**
 * The element that contains the content to be rendered when the dialog is open.
 */
export const DialogPanel = createPolymorphicComponent<"div", DialogPanelProps>(props => {
  let ref: HTMLDivElement | undefined;

  const context = useDialogContext();
  const portalContext = useDialogPortalContext();

  props = mergeDefaultProps(
    {
      as: "div",
      id: context.generateId("panel"),
    },
    props
  );

  const [local, others] = splitProps(props, ["as", "ref", "id", "forceMount", "onKeyDown"]);

  createEffect(() => onCleanup(context.registerPanel(local.id!)));

  const { overlayHandlers } = createOverlay(
    {
      isOpen: context.isOpen,
      onClose: context.close,
      isModal: () => context.overlayProps().isModal,
      preventScroll: () => context.overlayProps().preventScroll,
      closeOnInteractOutside: () => context.overlayProps().closeOnInteractOutside,
      closeOnEsc: () => context.overlayProps().closeOnEsc,
      shouldCloseOnInteractOutside: element => {
        return context.overlayProps().shouldCloseOnInteractOutside?.(element) ?? true;
      },
    },
    () => ref
  );

  const { FocusTrap } = createFocusTrapRegion(
    {
      trapFocus: () => context.focusTrapRegionProps().trapFocus && context.isOpen(),
      autoFocus: () => context.focusTrapRegionProps().autoFocus,
      restoreFocus: () => context.focusTrapRegionProps().restoreFocus,
    },
    () => ref
  );

  const onKeyDown: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> = e => {
    callHandler(e, local.onKeyDown);
    callHandler(e, overlayHandlers.onKeyDown);
  };

  return (
    <Show when={local.forceMount || portalContext?.forceMount() || context.isOpen()}>
      <FocusTrap />
      <Dynamic
        component={local.as}
        ref={mergeRefs(el => (ref = el), local.ref)}
        role="dialog"
        id={local.id}
        tabIndex={-1}
        aria-labelledby={context.titleId()}
        aria-describedby={context.descriptionId()}
        onKeyDown={onKeyDown}
        {...others}
      />
      <FocusTrap />
    </Show>
  );
});
