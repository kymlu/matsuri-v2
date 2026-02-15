import { useEffect, useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import { NewChoreoPage } from './pages/NewChoreoPage';
import ChoreoEditPage from './pages/ChoreoEditPage';
import ChoreoViewPage from './pages/ChoreoViewPage';
import { Choreo } from './models/choreo';

type Mode = "home" | "form" | "edit" | "view";

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedEvent, setSelectedEventName] = useState<string | undefined>();
  const [currentChoreo, setCurrentChoreo] = useState<Choreo | undefined>();

  useEffect(() => {
    console.log("Changing mode:", mode);
  }, [mode]);

  return (
    <div>
      {mode === "home" && (
        <HomePage
          goToNewChoreoPage={(event) => {
            setSelectedEventName(event);
            setMode("form");
          }}
          goToViewPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setMode("view");
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
          eventName={selectedEvent}
        />
      )}
      {mode === "edit" && (
        <ChoreoEditPage
          currentChoreo={currentChoreo!!}
          goToHomePage={() => setMode("home")}
          goToViewPage={(choreo) => {
            setCurrentChoreo(choreo);
            setMode("view");
          }}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo!!}
          goToHomePage={() => setMode("home")}
          goToEditPage={() => setMode("edit")}
        />
      )}
    </div>
  );
}

export default App;
