import React, { ErrorInfo } from "react";

type ComponentProps = {};
type ComponentState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<
  ComponentProps,
  ComponentState
> {
  state: ComponentState;

  constructor(props: {}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Caught exception: ${error} - ${errorInfo}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <h2>
          Well, that didn't work
          <span role="img" aria-label="Not amused">
            😐
          </span>
        </h2>
      );
    }

    return this.props.children;
  }
}
