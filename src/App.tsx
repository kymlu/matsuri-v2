import { useEffect, useState } from 'react';
import './App.css';
import HomePage, { ChoreoStatus } from './pages/HomePage';
import { NewChoreoPage } from './pages/NewChoreoPage';
import ChoreoEditPage from './pages/ChoreoEditPage';
import ChoreoViewPage from './pages/ChoreoViewPage';
import { BasicChoreoDetails, Choreo, EventDetails } from './models/choreo';
import { getUserName, setUserName } from './lib/dataAccess/LocalStorageController';
import { useNavigate, useParams } from 'react-router-dom';
import { Team } from './models/team';
import { checkLogin, verifyTeam } from './lib/helpers/apiHelper';
import AdminPage from './pages/AdminPage';
import { isNullOrUndefinedOrBlank } from './lib/helpers/globalHelper';
import { Oval } from 'react-loader-spinner';
import { colorPalette } from './lib/consts/colors';

type Mode = "home" | "form" | "edit" | "view" | "admin";

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedEvent, setSelectedEvent] = useState<EventDetails>();
  const [eventList, setEventList] = useState<EventDetails[]>([]);
  const [dancerNamesByEvent, setDancerNamesByEvent] = useState<Record<string, Record<string, string[]>>>({});
  const [serverChoreo, setServerChoreo] = useState<BasicChoreoDetails | undefined>();
  const [currentChoreo, setCurrentChoreo] = useState<Choreo | undefined>();
  const [currentChoreoStatus, setCurrentChoreoStatus] = useState<ChoreoStatus>();
  const [name, setName] = useState<string | null>(null);
  const [buildInfo, setBuildInfo] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [showNoTeamDialog, setShowNoTeamDialog] = useState<boolean>(false);

  const { teamSlug } = useParams();

  const [team, setTeam] = useState<Team | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    if (isNullOrUndefinedOrBlank(teamSlug)) {
      setShowNoTeamDialog(true);
      setIsProcessing(false);
    } else {
      verifyTeam(teamSlug!!, (t) => {
        setTeam(t);
        checkLogin(t?.id!,
        (name, role, teamMemberId) => {
          setNewName(name);
          setIsAdmin(role === "admin");
          setIsLoggedIn(true);
          setCurrentTeamMemberId(teamMemberId);
        }, () => {
          setIsLoggedIn(false);
        });
        setIsProcessing(false);
      }, () => {
        navigate('/');
        setIsProcessing(false);
      });
    }
  }, []);

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
      {
        currentTeamMemberId && team && mode === "admin" && (
          <AdminPage
            goToHomePage={() => setMode("home")}
            team={team}
            currentUserId={currentTeamMemberId}
          />
        )
      }
      {
        isProcessing &&
        <div className='w-full h-svh'>
          <Oval
            wrapperClass="mt-4 justify-self-center"
            color={colorPalette.primary}
            secondaryColor={colorPalette.rainbow.red[2]}/>
        </div>
      }
      {!isProcessing && mode === "home" && (
        <HomePage
          buildInfo={buildInfo}
          eventList={eventList}
          setEventList={(eventList) => {
            setEventList(eventList);
          }}
          goToAdminPage={() => {
            setMode("admin");
          }}
          goToNewChoreoPage={(event) => {
            setSelectedEvent(event);
            setMode("form");
          }}
          goToViewPage={(choreo: Choreo, status: ChoreoStatus, serverChoreo?: BasicChoreoDetails) => {
            setServerChoreo(serverChoreo);
            setCurrentChoreo(choreo);
            setCurrentChoreoStatus(status);
            setMode("view");
          }}
          savedDancerName={name}
          setSavedDancerName={(newName) => setNewName(newName)}
          dancerNamesByEvent={dancerNamesByEvent}
          setDancerNamesByEvent={(groupedNames) => setDancerNamesByEvent(groupedNames)}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          team={team}
          setCurrentTeamMemberId={(id) => setCurrentTeamMemberId(id)}
          showNoTeamDialog={showNoTeamDialog}
          setShowNoTeamDialog={setShowNoTeamDialog}
        />
      )}
      {mode === "form" && (
        <NewChoreoPage
          goToHomePage={() => setMode("home")}
          goToEditPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setCurrentChoreoStatus("localOnly")
            setMode("edit");
          }}
          eventList={eventList}
          selectedEvent={selectedEvent}
          teamId={team?.id}
        />
      )}
      {mode === "edit" && (
        <ChoreoEditPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToViewPage={(choreo) => {
            setCurrentChoreo(choreo);
            setMode("view");
          }}
          eventList={eventList}
          dancerNamesByEvent={dancerNamesByEvent}
          onChoreoEdited={() => {
            if (currentChoreoStatus === "upToDate") {
              setCurrentChoreoStatus("edited");
            }
          }}
          serverChoreo={serverChoreo}
          isLoggedIn={isLoggedIn}
          teamId={team?.id}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToEditPage={() => setMode("edit")}
          savedDancerName={name}
          teamId={team?.id}
        />
      )}
    </div>
  );
}

export default App;
