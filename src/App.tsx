import { useEffect, useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import { NewChoreoPage } from './pages/NewChoreoPage';
import ChoreoEditPage from './pages/ChoreoEditPage';
import ChoreoViewPage from './pages/ChoreoViewPage';
import { Choreo } from './models/choreo';
import { getUserName, setUserName } from './lib/dataAccess/LocalStorageController';
import { ManagerPage } from './pages/ManagerPage';

type Mode = "home" | "form" | "edit" | "view" | "manage";

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedEvent, setSelectedEventName] = useState<string | undefined>();
  const [eventList, setEventList] = useState<string[]>([]);
  const [dancerNamesByEvent, setDancerNamesByEvent] = useState<Record<string, Record<string, string[]>>>({});
  const [currentChoreo, setCurrentChoreo] = useState<Choreo | undefined>();
  const [name, setName] = useState<string | null>(null);
  const [buildInfo, setBuildInfo] = useState<string | undefined>();

  useEffect(() => {
    setName(getUserName());
    console.log("getting build info");
    fetch(`${process.env.PUBLIC_URL}/build-info.json`)
      .then(r => r.json())
      .then(info => {
        var buildDate = info.buildDate;
        console.log(`Build: ${buildDate}`);
        setBuildInfo(`更新 ${buildDate}`);
      });
  }, []);

  const setNewName = (newName: string) => {
    setUserName(newName);
    setName(newName);
  }

  useEffect(() => {
    console.log("Changing mode:", mode);
  }, [mode]);

  return (
    <div>
      {mode === "home" && (
        <HomePage
          buildInfo={buildInfo}
          eventList={eventList}
          setEventList={(eventList) => {
            setEventList(eventList);
          }}
          goToNewChoreoPage={(event) => {
            setSelectedEventName(event);
            setMode("form");
          }}
          goToViewPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setMode("view");
          }}
          goToManagePage={() => {
            setMode("manage");
          }}
          userName={name}
          setUserName={(newName) => setNewName(newName)}
          dancerNamesByEvent={dancerNamesByEvent}
          setDancerNamesByEvent={(groupedNames) => setDancerNamesByEvent(groupedNames)}
        />
      )}
      {mode === "form" && (
        <NewChoreoPage
          goToHomePage={() => setMode("home")}
          goToEditPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setMode("edit");
          }}
          eventList={eventList}
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
          eventList={eventList}
          dancerNamesByEvent={dancerNamesByEvent}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo!!}
          goToHomePage={() => setMode("home")}
          goToEditPage={() => setMode("edit")}
          userName={name}
        />
      )}
      {mode === "manage" && (
        <ManagerPage
          exit={() => setMode("home")}
        />
      )}
    </div>
  );
}

export default App;
