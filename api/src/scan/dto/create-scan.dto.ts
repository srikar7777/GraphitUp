import { IsUrl, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateScanDto {
    @IsNotEmpty({ message: 'URL is required' })
    @IsUrl(
        { require_protocol: true, protocols: ['http', 'https'] },
        { message: 'Must be a valid HTTP or HTTPS URL' },
    )
    @MaxLength(2048, { message: 'URL must not exceed 2048 characters' })
    url: string;
}
