import {
    FormControl,
    FormField,
    FormItem,
    Input,
    FormLabel,
    FormMessage
} from '@marzneshin/common/components';
import { FC } from 'react'
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface DeviceLimitFieldProps { }

export const DeviceLimitField: FC<DeviceLimitFieldProps> = () => {
    const { t } = useTranslation()
    const form = useFormContext()
    return (
        <FormField
            control={form.control}
            name="device_limit"
            render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel>{t('page.users.device_limit')}</FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            className="order-1"
                            {...field}
                            placeholder="-1"
                            min={-1}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
