import Badge from '@splunk/react-ui/Badge';
import Link from '@splunk/react-ui/Link';
import P from '@splunk/react-ui/Paragraph';
import Typography from '@splunk/react-ui/Typography';
import Layout from '@splunk/react-ui/Layout';
import { StyledContent, StyledHeading, StyledPage } from './Overview.styles';

const Overview = () => (
    <StyledPage>
        <StyledContent>
            <Layout>
                <StyledHeading level={1}>fleet-overview</StyledHeading>
                <Badge label="v1.0.0" />
            </Layout>
            <Typography as="p" size={16} lineHeight="normal">
                A standalone application built with the Splunk Design System. Start building data
                {'\u2011'}driven experiences with production{'\u2011'}ready components.
            </Typography>
            <Link appearance="standalone" to="https://splunkui.splunk.com" openInNewContext>
                Splunk UI docs
            </Link>
            <P>Edit App.tsx to begin</P>
        </StyledContent>
    </StyledPage>
);

export default Overview;
