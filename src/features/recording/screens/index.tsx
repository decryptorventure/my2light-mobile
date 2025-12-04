/**
 * Record Index - Redirects to settings
 * @module app/record/index
 */

import { Redirect } from "expo-router";

export default function RecordIndex() {
    return <Redirect href="/record/settings" />;
}
