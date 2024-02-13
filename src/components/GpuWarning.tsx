import './GPUWarning.css';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface GPUWarningProps {
  gpus: string[];
}

const openWaitlistLink = () => {
  window.open(
    'https://docs.google.com/forms/d/e/1FAIpQLSfZjT1wTsmwqEgqI3uXN-U5dgoGA5r93f77KTfnGxB4B5L5Dw/viewform',
    '_blank',
  );
};

export default function GPUWarning({ gpus }: GPUWarningProps) {
  return (
    <Card className="card">
      <CardContent>
        <div>
          <Typography className="subtitle" color="text.secondary" gutterBottom>
            Warning
          </Typography>
        </div>
        <Typography variant="h5" component="div">
          No supported gpu was detected
        </Typography>
        <Typography variant="body2">
          We do not recommend using stable diffusion app without an Nvidia gpu.
          We are working towards supporting more gpu types. Tell us your
          computer type through the{' '}
          <span
            className="link"
            onClick={openWaitlistLink}
            onKeyDown={openWaitlistLink}
            role="button"
            tabIndex={0}
          >
            waitlist
          </span>{' '}
          so we know which gpu has the most demand!
        </Typography>
      </CardContent>
      {gpus.map((gpu, index) => {
        const supported: boolean = gpu.toLowerCase().includes('nvidia');
        if (supported) {
          return (
            <ListItem key={index}>
              <ListItemAvatar className="list-item-avatar">
                <Avatar className="avatar-green">
                  <CheckCircleIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={gpu} secondary="supported" />
            </ListItem>
          );
        }
        return (
          <ListItem>
            <ListItemAvatar className="list-item-avatar">
              <Avatar className="avatar-red">
                <BlockIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={gpu} secondary="not supported" />
          </ListItem>
        );
      })}
    </Card>
  );
}
