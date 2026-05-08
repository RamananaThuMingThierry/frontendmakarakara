import React from "react";
import ErrorStatusPage from "../../pages/errors/ErrorStatusPage";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("Application render error", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorStatusPage
          statusCode={500}
          title="L'application a rencontre un probleme"
          message="Un incident a interrompu l'affichage. Rechargez la page pour reprendre."
          showRetry
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
