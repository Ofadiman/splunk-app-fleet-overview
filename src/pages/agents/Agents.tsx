import Heading from '@splunk/react-ui/Heading';
import SpotLight from '@splunk/react-ui/SpotLight';
import Typography from '@splunk/react-ui/Typography';
import { StyledContent, StyledPage } from './Agents.styles';

const Agents = () => (
    <StyledPage>
        <SpotLight variant="page-top" intensity="medium" />
        <StyledContent>
            <Heading level={1}>Agents</Heading>
            <Typography as="p" variant="body" color="default">
                Agents in your fleet will appear here.
            </Typography>
        </StyledContent>
    </StyledPage>
);

export default Agents;
