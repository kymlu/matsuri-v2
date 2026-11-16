import { useEffect, useState } from 'react';
import './App.css';
import HomePage, { ChoreoStatus } from './pages/HomePage';
import { NewChoreoPage } from './pages/NewChoreoPage';
import ChoreoEditPage from './pages/ChoreoEditPage';
import ChoreoViewPage from './pages/ChoreoViewPage';
import { BasicChoreoDetails, Choreo, EventDetails } from './models/choreo';
import { getMyDancerName, setMyDancerName } from './lib/dataAccess/LocalStorageController';
import { useNavigate, useParams } from 'react-router-dom';
import { Team } from './models/team';
import { checkLogin, verifyTeam } from './lib/helpers/apiHelper';
import AdminPage from './pages/AdminPage';
import RosterPage from './pages/RosterPage';
import { RosterKind } from './models/roster';
import { HelpProvider } from './components/help/HelpContext';
import { isNullOrUndefinedOrBlank } from './lib/helpers/globalHelper';
import { Grid } from 'react-loader-spinner';
import { colorPalette } from './lib/consts/colors';
import { useSearchParams } from 'react-router-dom';
import { Dialog } from '@base-ui/react';
import TeamLoadErrorDialog, { TeamLoadError } from './components/dialogs/TeamLoadErrorDialog';

type Mode = "home" | "form" | "edit" | "view" | "admin" | "roster";

function App() {
  const [mode, setMode] = useState<Mode>("home");
  // The 名簿 page's last tab, kept for the session.
  const [rosterTab, setRosterTab] = useState<RosterKind>("dancer");
  const [selectedEvent, setSelectedEvent] = useState<EventDetails>();
  const [eventList, setEventList] = useState<EventDetails[]>([]);
  const [serverChoreo, setServerChoreo] = useState<BasicChoreoDetails | undefined>();
  const [currentChoreo, setCurrentChoreo] = useState<Choreo | undefined>();
  const [currentChoreoStatus, setCurrentChoreoStatus] = useState<ChoreoStatus>();
  const [pastVersion, setPastVersion] = useState<number | undefined>();
  // The user's name: the account name when logged in, otherwise saved on this device (per team).
  const [savedDancerName, setSavedDancerName] = useState<string | null>(null);
  const [buildInfo, setBuildInfo] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isViewer, setIsViewer] = useState<boolean>(false);
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [showNoTeamDialog, setShowNoTeamDialog] = useState<boolean>(false);

  const { teamSlug } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();
  // Read the invite token once, then take it out of the address bar so it doesn't sit in browser history.
  const [setupToken] = useState(() => searchParams.get('setup'));
  useEffect(() => {
    if (searchParams.has('setup')) {
      const rest = new URLSearchParams(searchParams);
      rest.delete('setup');
      setSearchParams(rest, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const href = teamSlug ? `/api/manifest/${teamSlug}` : "/manifest.json";

    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [teamSlug]);

  const [team, setTeam] = useState<Team | undefined>(undefined);
  const [teamLoadError, setTeamLoadError] = useState<TeamLoadError | undefined>(undefined);
  const navigate = useNavigate();

  // Same as opening the app without a team, welcome dialog included.
  const goWithoutTeam = () => {
    setTeamLoadError(undefined);
    setSavedDancerName(getMyDancerName());
    navigate('/');
    setShowNoTeamDialog(true);
    setIsProcessing(false);
  }

  const loadTeam = () => {
    verifyTeam(teamSlug!!, (t) => {
      setTeamLoadError(undefined);
      setTeam(t);
      setSavedDancerName(getMyDancerName(t?.id));
      checkLogin(t?.id!,
      (name, role, teamMemberId) => {
        setMyDancerName(t?.id, name);
        setSavedDancerName(name.trim());
        setIsAdmin(role === "admin");
        setIsViewer(role === "viewer");
        setIsLoggedIn(true);
        setCurrentTeamMemberId(teamMemberId);
      }, () => {
        setIsLoggedIn(false);
      });
      setIsProcessing(false);
    }, (status) => {
      // Keep the loading screen behind the dialog until the person chooses what to do.
      setTeamLoadError(status === 404 ? "notFound" : "connection");
    });
  }

  useEffect(() => {
    if (isNullOrUndefinedOrBlank(teamSlug)) {
      setSavedDancerName(getMyDancerName());
      setShowNoTeamDialog(true);
      setIsProcessing(false);
    } else {
      loadTeam();
    }
  }, []);

  useEffect(() => {
    console.log("getting build info");
    fetch(`${process.env.PUBLIC_URL}/build-info.json`)
      .then(r => r.json())
      .then(info => {
        const buildDate = info.buildDate;
        console.log(`Build: ${buildDate}`);
        setBuildInfo(`更新 ${buildDate}`);
      });
  }, []);

  const saveDancerName = (newName: string) => {
    setMyDancerName(team?.id, newName);
    setSavedDancerName(newName.trim());
  }

  useEffect(() => {
    console.log("Changing mode:", mode);
  }, [mode]);

  return (
    <HelpProvider reader={{ hasTeam: !!team, isLoggedIn, isViewer, isAdmin }}>
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
        team && isLoggedIn && !isViewer && mode === "roster" && (
          <RosterPage
            goToHomePage={() => setMode("home")}
            team={team}
            tab={rosterTab}
            onTabChange={setRosterTab}
          />
        )
      }
      <Dialog.Root open={!!teamLoadError}>
        {
          teamLoadError &&
          <TeamLoadErrorDialog
            error={teamLoadError}
            teamSlug={teamSlug ?? ""}
            onRetry={() => {
              setTeamLoadError(undefined);
              loadTeam();
            }}
            onUseWithoutTeam={goWithoutTeam}/>
        }
      </Dialog.Root>
      {
        isProcessing &&
        <div className='w-full h-svh'>
          <Grid
              height={44}
              width={44}
              wrapperClass="mt-4 justify-self-center"
              color={colorPalette.primary}
              ariaLabel="読み込み中"/>
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
          goToRosterPage={() => {
            setMode("roster");
          }}
          goToNewChoreoPage={(event) => {
            setSelectedEvent(event);
            setMode("form");
          }}
          goToViewPage={(choreo: Choreo, status: ChoreoStatus, serverChoreo?: BasicChoreoDetails, pastVersion?: number) => {
            setServerChoreo(serverChoreo);
            setCurrentChoreo(choreo);
            setCurrentChoreoStatus(status);
            setPastVersion(pastVersion);
            setMode("view");
          }}
          savedDancerName={savedDancerName}
          setSavedDancerName={saveDancerName}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          isViewer={isViewer}
          setIsViewer={setIsViewer}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          team={team}
          setCurrentTeamMemberId={(id) => setCurrentTeamMemberId(id)}
          showNoTeamDialog={showNoTeamDialog}
          setShowNoTeamDialog={setShowNoTeamDialog}
          setupToken={setupToken}
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
          canUseRoster={!!team && isLoggedIn && !isViewer}
        />
      )}
      {mode === "edit" && (
        <ChoreoEditPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToViewPage={(choreo) => {
            setCurrentChoreo(choreo);
            setPastVersion(undefined);
            setMode("view");
          }}
          eventList={eventList}
          onChoreoEdited={() => {
            if (currentChoreoStatus === "upToDate") {
              setCurrentChoreoStatus("edited");
            }
          }}
          serverChoreo={serverChoreo}
          isLoggedIn={isLoggedIn}
          isViewer={isViewer}
          teamId={team?.id}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToEditPage={() => setMode("edit")}
          pastVersion={pastVersion}
          myDancerName={savedDancerName}
          setSavedDancerName={isLoggedIn ? undefined : saveDancerName}
          teamId={team?.id}
          serverChoreo={serverChoreo}
        />
      )}
    </div>
    </HelpProvider>
  );
}

export default App;
