import { useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import { NewChoreoPage } from './pages/NewChoreoPage';
import ChoreoEditPage from './pages/ChoreoEditPage';
import ChoreoViewPage from './pages/ChoreoViewPage';
import { Choreo } from './models/choreo';
import { ChoreoSection } from './models/choreoSection';

type Mode = "home" | "form" | "edit" | "view";

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const [currentChoreo, setCurrentChoreo] = useState<Choreo | undefined>();

  return (
    <div>
      {mode === "home" && (
        <HomePage
          goToNewChoreoPage={() => setMode("form")}
          goToEditPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setMode("edit");
          }}
          goToViewPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setMode("view");
          }}
          onUploadSuccess={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setMode("edit");
          }}
        />
      )}
      {mode === "form" && (
        <NewChoreoPage
          goToHomePage={() => setMode("home")}
          goToEditPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setMode("edit");
          }}
        />
      )}
      {mode === "edit" && (
        <ChoreoEditPage
          currentChoreo={currentChoreo!!}
          goToHomePage={() => setMode("home")}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo!!}
          goToHomePage={() => setMode("home")}
        />
      )}
    </div>
  );
}

export default App;
