import { For, JSX, Match, Show, Switch } from "solid-js";
import useInputError from "../../hooks/useInputError";
import { FlatBtn } from "./buttons/FlatBtn";
import InputField from "./inputs/InputField";
import RadioList from "./inputs/RadioList";
import Select from "./inputs/Select";

export type Option = {
  value: string;
  display?: string;
};

type UnitsDisplay = Omit<Partial<Fields>, "unitsDisplay">;

export type Fields = {
  label: string;
  name: string;
  type: "text" | "number" | "dropdown" | "radioList";
  defaultValue?: string | number;
  options?: Option[];
  unitsDisplay?: UnitsDisplay;
};

export interface FormProps {
  fields: Fields[];
  inputValues: { [key: string]: string | number };
  actionBtnText?: string;
  isCancelBtn: boolean;
  cancelBtnText?: string;
  handleInputChange: JSX.EventHandler<HTMLInputElement, InputEvent>;
  handleSelectChange: JSX.EventHandler<HTMLSelectElement, InputEvent>;
  submitAction: (() => Promise<void>) | (() => void);
  cleanUp?: () => void;
  close: () => void;
  setError: (string: string) => void;
  customStyles?: CSSModuleClasses;
}

export function Form(props: FormProps) {
  const fieldNames = props.fields.map((f) => f.name);
  const { inputError, validateInput, submitForm } = useInputError(fieldNames);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        props.cleanUp = props.cleanUp || props.close;
        await submitForm(e.currentTarget, props.submitAction, props.cleanUp);
      }}
      class={props.customStyles?.form}
    >
      <div class="content">
        <input type="password" hidden />
        {/* need this to turn off autocomplete */}
        <For each={props.fields}>
          {(f: Fields, idx) => {
            switch (f.type) {
              case "dropdown":
                return (
                  <Select
                    onInput={props.handleSelectChange}
                    value={(props.inputValues[f.name] as string) || ""}
                    {...f}
                  />
                );
              case "radioList": {
                return (
                  <RadioList
                    onInput={props.handleInputChange}
                    value={(props.inputValues[f.name] as string) || ""}
                    {...f}
                  />
                );
              }
              default: {
                const onInput: JSX.EventHandler<
                  HTMLInputElement,
                  InputEvent
                > = (e) => {
                  validateInput(e.currentTarget as HTMLInputElement);
                  props.handleInputChange(e);
                };
                const onBlur: JSX.FocusEventHandler<
                  HTMLInputElement,
                  FocusEvent
                > = (e) => validateInput(e.currentTarget);

                return (
                  <Switch>
                    <Match when={f.unitsDisplay}>
                      <div class="input_wrapper_with_units">
                        <InputField
                          autoFocus={idx() === 0}
                          onBlur={onBlur}
                          error={inputError[f.name]}
                          onInput={onInput}
                          value={props.inputValues[f.name] ?? ""}
                          {...f}
                          type={f.type}
                        />
                        <Select
                          onInput={props.handleSelectChange}
                          value={
                            (props.inputValues[
                              f.unitsDisplay?.name as string
                            ] as string) || ""
                          }
                          {...f.unitsDisplay}
                        />
                      </div>
                    </Match>
                    <Match when={!f.unitsDisplay}>
                      <InputField
                        autoFocus={idx() === 0}
                        onBlur={onBlur}
                        error={inputError[f.name]}
                        onInput={onInput}
                        value={props.inputValues[f.name] || ""}
                        {...f}
                        type={f.type}
                      />
                    </Match>
                  </Switch>
                );
              }
            }
          }}
        </For>
      </div>
      <footer>
        <div class="btn-ctn">
          <Show when={props.isCancelBtn}>
            <FlatBtn
              text={props.cancelBtnText || "Cancel"}
              underline={true}
              onClick={props.close}
              size="small"
            />
          </Show>
          <FlatBtn
            type="submit"
            text={props.actionBtnText || "Done"}
            filled={true}
            size="small"
          />
        </div>
      </footer>
    </form>
  );
}
