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
  const [currentChoreo, setCurrentChoreo] = useState<Choreo>({
    name: "Test Name",
    id: "Test Id",
    event: "Test Event",
    stageType: "stage",
    sections: [{id: "Test Section Id", name: "Section Name", formation: {}, order: 1} as ChoreoSection], 
    length: 10,
    width: 10,
    margins: {topMargin: 3, bottomMargin: 3, leftMargin: 5, rightMargin: 5},
    dancers: {},
    props: {},
  } as Choreo);

  return (
    <div>
      {mode === "home" && (
        <HomePage
          goToNewChoreoPage={() => setMode("form")}
          goToEditPage={() => setMode("edit")}
          goToViewPage={() => setMode("view")}
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
          currentChoreo={currentChoreo}
          goToHomePage={() => setMode("home")}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo}
          goToHomePage={() => setMode("home")}
        />
      )}
    </div>
  );
}

export default App;
